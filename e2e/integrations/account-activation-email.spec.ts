/**
 * Creating accounts for apartments in bulk emails each owner the login
 * address and a temporary password.
 */

import { expect, test } from '../fixtures';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';
import { expectDeliveredEmail } from '../utils/email-assertions';
import { loginWithTurnstile, waitForMail } from '../utils/mock-server';
import { openTestHoaCard } from '../utils/open-test-hoa';
import { isServerActionResponse } from '../utils/server-actions';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';

const ACTIVATION_SUBJECT = 'Twoje konto zostało utworzone – ustaw nowe hasło';
const TEMP_PASSWORD_LINE = /Tymczasowe hasło\s+(\S+)/;

test('the owner receives the login email and a temporary password', async ({
  page,
  request,
}) => {
  const apartment = await createUniqueUnassignedApartment();
  await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.goto('/admin/users/management');
  await openTestHoaCard(page);
  await page.locator(`#apt-${apartment.id}`).click();
  await page.getByRole('button', { name: /Zaproś użytkowników/i }).click();
  await page.getByRole('button', { name: 'Dalej' }).click();
  await Promise.all([
    page.waitForResponse(isServerActionResponse),
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Zaproś użytkowników' })
      .click(),
  ]);
  await expect(page.getByText(/Utworzono \d+ kont/i)).toBeVisible();

  const mail = await waitForMail(request, apartment.email, {
    subject: ACTIVATION_SUBJECT,
  });
  const tempPassword = mail.text.match(TEMP_PASSWORD_LINE)?.[1] ?? '';
  expect(tempPassword).not.toBe('');
  expectDeliveredEmail(mail, {
    to: apartment.email,
    subject: ACTIVATION_SUBJECT,
    both: [
      apartment.email,
      tempPassword,
      'Administrator utworzył dla Ciebie konto',
    ],
    html: ['Zaloguj się'],
    linkPath: '/login',
  });

  await page.context().clearCookies();
  await loginWithTurnstile(page, apartment.email, tempPassword);
  await expect(page).toHaveURL(/change-password|dashboard/);
});
