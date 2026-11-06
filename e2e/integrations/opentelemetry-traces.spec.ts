/**
 * With OpenTelemetry enabled the integrations server keeps serving requests and
 * exports server spans and database spans for the requests it handles.
 */

import { expect, test } from '../fixtures';
import { submitLoginForm } from '../utils/auth-forms';
import { createCredentialsUser } from '../utils/create-credentials-user';
import {
  EXPORT_TIMEOUT_MS,
  HTTP_INSTRUMENTATION_SCOPE,
  pollUntil,
  SERVER_SPAN_KIND,
  SERVICE_NAME,
  TRACE_ID_PATTERN,
} from '../utils/otlp';
import { listSpans } from '../utils/otlp-capture';
import { E2E_PASSWORD } from '../utils/test-credentials';

const READINESS_PATH = '/api/health/readiness';
const LOGIN_PATH = '/login';
const POSTGRES_SYSTEM = 'postgresql';

test.describe('OpenTelemetry traces', () => {
  test('readiness is answered with telemetry enabled', async ({ request }) => {
    const response = await request.get(READINESS_PATH);

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ready' });
  });

  test('requests become server spans named by method and path', async ({
    request,
  }) => {
    // HttpInstrumentation skips health probes. Next still names its own span
    // for the probe, so only spans from the HTTP instrumentation are checked.
    await request.get(READINESS_PATH);
    await request.get(LOGIN_PATH);

    const span = await pollUntil(
      async () =>
        (await listSpans(request)).find(
          (candidate) =>
            candidate.scope === HTTP_INSTRUMENTATION_SCOPE &&
            candidate.name === `GET ${LOGIN_PATH}` &&
            candidate.serviceName === SERVICE_NAME
        ),
      EXPORT_TIMEOUT_MS
    );

    expect(span.kind).toBe(SERVER_SPAN_KIND);
    expect(span.traceId).toMatch(TRACE_ID_PATTERN);
    const spans = await listSpans(request);
    expect(
      spans.some(
        (candidate) =>
          candidate.scope === HTTP_INSTRUMENTATION_SCOPE &&
          candidate.name.includes(READINESS_PATH)
      )
    ).toBe(false);
    expect(await (await request.get(READINESS_PATH)).status()).toBe(200);
  });

  test('database queries are child spans of the request that ran them', async ({
    page,
    request,
  }) => {
    const email = `otel-trace-${Date.now()}@e2e-test.com`;
    await createCredentialsUser({
      email,
      password: E2E_PASSWORD,
      name: 'Trace',
    });
    await submitLoginForm(page, email, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);

    const query = await pollUntil(async () => {
      const spans = await listSpans(request);
      return spans.find(
        (candidate) =>
          (candidate.attributes['db.system.name'] ??
            candidate.attributes['db.system']) === POSTGRES_SYSTEM &&
          spans.some(
            (parent) =>
              parent.spanId === candidate.parentSpanId &&
              parent.traceId === candidate.traceId &&
              parent.kind === SERVER_SPAN_KIND
          )
      );
    }, EXPORT_TIMEOUT_MS);

    expect(query.traceId).toMatch(TRACE_ID_PATTERN);
    expect(await (await request.get(READINESS_PATH)).status()).toBe(200);
  });
});
