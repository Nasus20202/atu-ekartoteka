/**
 * Approving a pending account in the admin panel emails the user.
 */

import { expect, test } from '../fixtures';
import {
  approveWithApartment,
  openUsersPage,
  userCard,
} from '../utils/admin-users';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';
import {
  loginWithTurnstile,
  stubTurnstileWidget,
  TURNSTILE_VALID_TOKEN,
  waitForMail,
} from '../utils/mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';

const APPROVED_SUBJECT = 'Twoje konto zostało zatwierdzone';
const PASSWORD = 'SecurePassword123!';

test('the user gets an email when an admin approves the account', async ({
  browser,
  page,
  request,
}) => {
  const apartment = await createUniqueUnassignedApartment();
  const email = `approved-${Date.now()}@e2e-test.com`;

  await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Imię i nazwisko').fill('Approved Mail User');
  await page.getByLabel('Hasło', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Potwierdź hasło').fill(PASSWORD);
  await page.getByRole('button', { name: /Zarejestruj się/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginWithTurnstile(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
  await openUsersPage(adminPage);
  await expect(userCard(adminPage, email)).toBeVisible();
  await approveWithApartment(
    adminPage,
    email,
    'ul. Testowa 1/2B',
    apartment.externalOwnerId
  );
  await adminContext.close();

  const mail = await waitForMail(request, email, { subject: APPROVED_SUBJECT });
  expect(mail.html).toContain('Zaloguj się');
  expect(mail.text).toContain('/login');
});
