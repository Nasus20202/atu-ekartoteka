/**
 * Registration sends real emails to the SMTP mock: the verification link for
 * the user and the approval request for the admins.
 */

import { expect, test } from '../fixtures';
import { expectDeliveredEmail } from '../utils/email-assertions';
import {
  extractLink,
  stubTurnstileWidget,
  TURNSTILE_VALID_TOKEN,
  waitForMail,
} from '../utils/mock-server';
import { ADMIN_EMAIL } from '../utils/test-credentials';

const VERIFICATION_SUBJECT = 'Potwierdź swój adres email';
const ADMIN_NOTICE_SUBJECT =
  'Nowa rejestracja użytkownika - wymaga zatwierdzenia';
const PASSWORD = 'SecurePassword123!';

test.describe('Registration emails', () => {
  test('the verification email link verifies the address', async ({
    page,
    request,
  }) => {
    const email = `verify-${Date.now()}@e2e-test.com`;
    await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Imię i nazwisko').fill('Mail Verify User');
    await page.getByLabel('Hasło', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Potwierdź hasło').fill(PASSWORD);
    await page.getByRole('button', { name: /Zarejestruj się/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const mail = await waitForMail(request, email, {
      subject: VERIFICATION_SUBJECT,
    });
    expectDeliveredEmail(mail, {
      to: email,
      subject: VERIFICATION_SUBJECT,
      both: ['Mail Verify User', 'Dziękujemy za rejestrację'],
      html: ['Potwierdź adres email'],
      text: ['Link wygaśnie za 24 godziny'],
      linkPath: '/verify-email?token=',
    });

    await page.goto(extractLink(mail, '/verify-email'));

    await expect(page.getByText('Email zweryfikowany!')).toBeVisible();
  });

  test('admins are told about the new registration', async ({
    page,
    request,
  }) => {
    const email = `notify-${Date.now()}@e2e-test.com`;
    await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Hasło', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Potwierdź hasło').fill(PASSWORD);
    await page.getByRole('button', { name: /Zarejestruj się/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const notice = await waitForMail(request, ADMIN_EMAIL, {
      subject: ADMIN_NOTICE_SUBJECT,
      contains: email,
    });
    expectDeliveredEmail(notice, {
      to: ADMIN_EMAIL,
      subject: ADMIN_NOTICE_SUBJECT,
      both: [email, 'Nowy użytkownik zarejestrował się w systemie'],
      html: ['Otwórz panel administracyjny'],
      linkPath: '/admin/users',
    });
  });
});
