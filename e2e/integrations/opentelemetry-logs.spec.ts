/**
 * Log records keep the severity of the app's log line and the trace of the
 * request that wrote it, so a log can be found from its request and back.
 */

import { expect, test } from '../fixtures';
import {
  expectLoginRejected,
  submitLoginForm,
  submitRegistrationForm,
} from '../utils/auth-forms';
import { createCredentialsUser } from '../utils/create-credentials-user';
import {
  EXPORT_TIMEOUT_MS,
  pollUntil,
  SERVER_SPAN_KIND,
  SERVICE_NAME,
  TRACE_ID_PATTERN,
} from '../utils/otlp';
import { listLogs, listSpans } from '../utils/otlp-capture';
import { E2E_PASSWORD, WRONG_PASSWORD } from '../utils/test-credentials';

const REGISTER_SPAN = 'POST /register';

test.describe('OpenTelemetry logs', () => {
  test('a failed login is logged as a warning with its request trace', async ({
    page,
    request,
  }) => {
    const email = `otel-failed-${Date.now()}@e2e-test.com`;
    await createCredentialsUser({
      email,
      password: E2E_PASSWORD,
      name: 'Failed',
    });
    await submitLoginForm(page, email, WRONG_PASSWORD);
    await expectLoginRejected(page);

    const log = await pollUntil(
      async () =>
        (await listLogs(request)).find(
          (candidate) =>
            candidate.body === 'Failed login attempt: incorrect password' &&
            candidate.attributes.email === email
        ),
      EXPORT_TIMEOUT_MS
    );

    expect(log.severity).toBe('WARN');
    expect(log.serviceName).toBe(SERVICE_NAME);
    expect(log.traceId).toMatch(TRACE_ID_PATTERN);
    await pollUntil(
      async () =>
        (await listSpans(request)).find(
          (candidate) =>
            candidate.traceId === log.traceId &&
            candidate.kind === SERVER_SPAN_KIND
        ),
      EXPORT_TIMEOUT_MS
    );
  });

  test('a successful login is logged as info with its request trace', async ({
    page,
    request,
  }) => {
    const email = `otel-success-${Date.now()}@e2e-test.com`;
    await createCredentialsUser({
      email,
      password: E2E_PASSWORD,
      name: 'Success',
    });
    await submitLoginForm(page, email, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);

    const log = await pollUntil(
      async () =>
        (await listLogs(request)).find(
          (candidate) =>
            candidate.body === 'User logged in successfully' &&
            candidate.attributes.email === email
        ),
      EXPORT_TIMEOUT_MS
    );

    expect(log.severity).toBe('INFO');
    expect(log.traceId).toMatch(TRACE_ID_PATTERN);
  });

  test('the verification email is logged inside the registration request trace', async ({
    page,
    request,
  }) => {
    const email = `otel-register-${Date.now()}@e2e-test.com`;
    await submitRegistrationForm(page, email, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);

    const log = await pollUntil(
      async () =>
        (await listLogs(request)).find(
          (candidate) =>
            candidate.body === 'Email sent successfully' &&
            candidate.attributes.to === email
        ),
      EXPORT_TIMEOUT_MS
    );

    expect(log.severity).toBe('INFO');
    const registration = await pollUntil(
      async () =>
        (await listSpans(request)).find(
          (candidate) =>
            candidate.name === REGISTER_SPAN &&
            candidate.traceId === log.traceId
        ),
      EXPORT_TIMEOUT_MS
    );
    expect(registration.kind).toBe(SERVER_SPAN_KIND);
  });
});
