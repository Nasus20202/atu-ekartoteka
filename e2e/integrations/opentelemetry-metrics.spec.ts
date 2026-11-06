/**
 * Every custom metric the app records is exported. The flows run first, in
 * order, then the spec waits for an export that carries all of them. Metrics
 * are pushed once a minute and counters only grow, so one export is enough.
 */

import { expect, test } from '../fixtures';
import {
  expectLoginRejected,
  submitLoginForm,
  submitRegistrationForm,
} from '../utils/auth-forms';
import { createCredentialsUser } from '../utils/create-credentials-user';
import {
  extractLink,
  stubTurnstileWidget,
  TURNSTILE_INVALID_TOKEN,
  TURNSTILE_VALID_TOKEN,
  waitForMail,
} from '../utils/mock-server';
import {
  hasMetricPoint,
  latestPointValue,
  METRIC_EXPORT_TIMEOUT_MS,
  pollUntil,
} from '../utils/otlp';
import { listMetrics } from '../utils/otlp-capture';
import {
  ADMIN_EMAIL,
  E2E_PASSWORD,
  RESET_NEW_PASSWORD,
  WRONG_PASSWORD,
} from '../utils/test-credentials';

const SECOND_MS = 1000;
const METRIC_TEST_MARGIN_MS = 30 * SECOND_MS;
const VERIFICATION_SUBJECT = 'Potwierdź swój adres email';
const ADMIN_NOTICE_SUBJECT =
  'Nowa rejestracja użytkownika - wymaga zatwierdzenia';
const RESET_SUBJECT = 'Resetowanie hasła';
const DB_SIZE_METRIC = 'ekartoteka.db.size';
const USER_TABLE = { table: 'user' };
const TRACKED_TABLES = [
  'homeownersAssociation',
  'apartment',
  'charge',
  'chargeNotification',
  'payment',
  'user',
];

const CREDENTIALS = { provider: 'credentials' };
const EXPECTED_POINTS: [string, Record<string, string>][] = [
  ['ekartoteka.auth.login', { ...CREDENTIALS, result: 'success' }],
  [
    'ekartoteka.auth.login',
    { ...CREDENTIALS, result: 'failure', reason: 'invalid_turnstile' },
  ],
  [
    'ekartoteka.auth.login',
    { ...CREDENTIALS, result: 'failure', reason: 'user_not_found' },
  ],
  [
    'ekartoteka.auth.login',
    { ...CREDENTIALS, result: 'failure', reason: 'invalid_credentials' },
  ],
  ['ekartoteka.auth.registration', { ...CREDENTIALS, result: 'success' }],
  ['ekartoteka.auth.email_verification', { result: 'success' }],
  ['ekartoteka.auth.password_reset', { result: 'success' }],
  ['ekartoteka.email.sent', { type: 'verification', result: 'success' }],
  ['ekartoteka.email.sent', { type: 'admin_notification', result: 'success' }],
  ['ekartoteka.email.sent', { type: 'password_reset', result: 'success' }],
];

const METRIC_TEST_TIMEOUT_MS = METRIC_EXPORT_TIMEOUT_MS + METRIC_TEST_MARGIN_MS;

test.describe('OpenTelemetry metrics', () => {
  // The flows share state: each step relies on the one before it
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(METRIC_TEST_TIMEOUT_MS);

  const email = `otel-metrics-${Date.now()}@e2e-test.com`;
  const resetEmail = `otel-reset-${Date.now()}@e2e-test.com`;

  test('credentials logins are counted by result and reason', async ({
    page,
  }) => {
    await createCredentialsUser({
      email,
      password: E2E_PASSWORD,
      name: 'Metrics',
    });

    await submitLoginForm(page, email, E2E_PASSWORD, TURNSTILE_INVALID_TOKEN);
    await expectLoginRejected(page);

    await submitLoginForm(page, `missing-${email}`, E2E_PASSWORD);
    await expectLoginRejected(page);

    await submitLoginForm(page, email, WRONG_PASSWORD);
    await expectLoginRejected(page);

    await submitLoginForm(page, email, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('registration and the verification link are counted', async ({
    page,
    request,
  }) => {
    const newUser = `otel-register-${Date.now()}@e2e-test.com`;
    await submitRegistrationForm(page, newUser, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);

    const verification = await waitForMail(request, newUser, {
      subject: VERIFICATION_SUBJECT,
    });
    await waitForMail(request, ADMIN_EMAIL, {
      subject: ADMIN_NOTICE_SUBJECT,
      contains: newUser,
    });
    await page.goto(extractLink(verification, '/verify-email'));
    await expect(page.getByText('Email zweryfikowany!')).toBeVisible();
  });

  test('a password reset is counted', async ({ page, request }) => {
    await createCredentialsUser({
      email: resetEmail,
      password: E2E_PASSWORD,
      name: 'Reset Metrics',
    });
    await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(resetEmail);
    await page
      .getByRole('button', { name: /Wyślij link resetowania/i })
      .click();

    const mail = await waitForMail(request, resetEmail, {
      subject: RESET_SUBJECT,
    });
    await page.goto(extractLink(mail, '/reset-password'));
    await page.getByLabel('Nowe hasło').fill(RESET_NEW_PASSWORD);
    await page.getByLabel('Potwierdź hasło').fill(RESET_NEW_PASSWORD);
    await page.getByRole('button', { name: /Zresetuj hasło/i }).click();
    await expect(
      page.getByText(/Hasło.*zmienione|sukces|zaloguj/i).first()
    ).toBeVisible();
  });

  test('all custom metrics are exported', async ({ request }) => {
    const metrics = await pollUntil(async () => {
      const captured = await listMetrics(request);
      const complete =
        EXPECTED_POINTS.every(([name, attributes]) =>
          hasMetricPoint(captured, name, attributes)
        ) && (latestPointValue(captured, DB_SIZE_METRIC, USER_TABLE) ?? 0) >= 1;
      return complete ? captured : undefined;
    }, METRIC_EXPORT_TIMEOUT_MS);

    const tables = metrics
      .filter((metric) => metric.name === DB_SIZE_METRIC)
      .flatMap((metric) => metric.points)
      .map((point) => point.attributes.table);
    expect(tables).toEqual(expect.arrayContaining(TRACKED_TABLES));
    expect(
      latestPointValue(metrics, DB_SIZE_METRIC, USER_TABLE)
    ).toBeGreaterThanOrEqual(1);
  });
});
