/**
 * Rejecting an approved user: the confirmation can be cancelled, and a
 * confirmed rejection keeps the apartments assigned to the account.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import {
  approveWithApartment,
  createUser,
  openUsersPage,
  showAllUsers,
  userCard,
} from '../utils/admin-users';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';

const CONFIRM_TITLE = 'Odrzuć użytkownika';
const LOAD_TIMEOUT_MS = 10000;

/** Creates a user and approves it with one apartment; returns the email. */
async function createApprovedUserWithApartment(page: Page) {
  const apartment = await createUniqueUnassignedApartment();
  const email = `reject-${Date.now()}@e2e-test.com`;

  await openUsersPage(page);
  await createUser(page, email, 'Reject Test User');
  await approveWithApartment(
    page,
    email,
    'ul. Testowa 1/2B',
    apartment.externalOwnerId
  );
  await showAllUsers(page);

  return email;
}

/** Chooses "Odrzucony" in the status dialog and returns the confirmation. */
async function startRejection(page: Page, email: string) {
  await userCard(page, email)
    .getByRole('button', { name: 'Zmień status' })
    .click();
  await page.getByRole('button', { name: 'Odrzucony', exact: true }).click();

  return page.getByRole('dialog', { name: CONFIRM_TITLE });
}

test('cancelling the rejection keeps the account approved', async ({
  adminPage,
}) => {
  const email = await createApprovedUserWithApartment(adminPage);
  const confirm = await startRejection(adminPage, email);
  await expect(confirm).toBeVisible();

  await confirm.getByRole('button', { name: 'Anuluj' }).click();

  await expect(confirm).not.toBeVisible({ timeout: LOAD_TIMEOUT_MS });
  const card = userCard(adminPage, email);
  await expect(card.getByText(/zatwierdzony/i)).toBeVisible();
  await expect(card.getByText(/Przypisane mieszkania: 1/i)).toBeVisible();
});

test('confirmed rejection keeps the apartments assigned', async ({
  adminPage,
}) => {
  const email = await createApprovedUserWithApartment(adminPage);
  const confirm = await startRejection(adminPage, email);
  await expect(confirm).toBeVisible();

  await confirm.getByRole('button', { name: 'Odrzuć', exact: true }).click();

  const card = userCard(adminPage, email);
  await expect(card.getByText(/odrzucony/i)).toBeVisible({
    timeout: LOAD_TIMEOUT_MS,
  });
  await expect(card.getByText(/Przypisane mieszkania: 1/i)).toBeVisible();
});
