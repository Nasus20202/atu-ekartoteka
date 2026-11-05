/**
 * The password reset email delivered over SMTP carries a working link.
 */

import { expect, test } from '../fixtures';
import { createCredentialsUser } from '../utils/create-credentials-user';
import { expectDeliveredEmail } from '../utils/email-assertions';
import {
  extractLink,
  loginWithTurnstile,
  stubTurnstileWidget,
  TURNSTILE_VALID_TOKEN,
  waitForMail,
} from '../utils/mock-server';

const RESET_SUBJECT = 'Resetowanie hasła';
const OLD_PASSWORD = 'OldPassword123!';
const NEW_PASSWORD = 'BrandNewPassword456!';

test('a user resets the password with the emailed link', async ({
  page,
  request,
}) => {
  const email = `reset-mail-${Date.now()}@e2e-test.com`;
  await createCredentialsUser({
    email,
    password: OLD_PASSWORD,
    name: 'Reset Mail User',
  });
  await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: /Wyślij link resetowania/i }).click();

  const mail = await waitForMail(request, email, { subject: RESET_SUBJECT });
  expectDeliveredEmail(mail, {
    to: email,
    subject: RESET_SUBJECT,
    both: ['Reset Mail User', 'zresetowanie hasła'],
    html: ['Zresetuj hasło'],
    text: ['Link wygaśnie za 1 godzinę'],
    linkPath: '/reset-password?token=',
  });

  await page.goto(extractLink(mail, '/reset-password'));
  await page.getByLabel('Nowe hasło').fill(NEW_PASSWORD);
  await page.getByLabel('Potwierdź hasło').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: /Zresetuj hasło/i }).click();
  await expect(
    page.getByText(/Hasło.*zmienione|sukces|zaloguj/i).first()
  ).toBeVisible();

  await loginWithTurnstile(page, email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard/);
});
