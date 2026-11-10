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
    const userId = await createCredentialsUser({
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
            candidate.attributes.userId === userId
        ),
      EXPORT_TIMEOUT_MS
    );

    expect(log.severity).toBe('WARN');
    // The account is identified by its id, never by the address typed in
    expect(JSON.stringify(log)).not.toContain(email);
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
    const userId = await createCredentialsUser({
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
            candidate.attributes.userId === userId
        ),
      EXPORT_TIMEOUT_MS
    );

    expect(log.severity).toBe('INFO');
    expect(JSON.stringify(log)).not.toContain(email);
    expect(log.traceId).toMatch(TRACE_ID_PATTERN);
  });

  test('the verification email is logged inside the registration request trace', async ({
    page,
    request,
  }) => {
    const email = `otel-register-${Date.now()}@e2e-test.com`;
    await submitRegistrationForm(page, email, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);

    // The log names the kind of e-mail, not the recipient, so it is found by
    // the request it belongs to: the e-mail sent while the form was handled
    const { log, registration } = await pollUntil(async () => {
      const [logs, spans] = await Promise.all([
        listLogs(request),
        listSpans(request),
      ]);
      for (const candidate of logs) {
        if (candidate.body !== 'Email sent') continue;
        if (candidate.attributes.type !== 'verification') continue;
        const span = spans.find(
          (item) =>
            item.name === REGISTER_SPAN && item.traceId === candidate.traceId
        );
        if (span) return { log: candidate, registration: span };
      }
      return undefined;
    }, EXPORT_TIMEOUT_MS);

    expect(log.severity).toBe('INFO');
    expect(JSON.stringify(log)).not.toContain(email);
    expect(registration.kind).toBe(SERVER_SPAN_KIND);
  });
});
