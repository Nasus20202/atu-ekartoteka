/**
 * Admin user creation and approval tests
 */

import { expect, test } from '../fixtures';
import {
  approveWithApartment,
  createUser,
  openUsersPage,
  showAllUsers,
  userCard,
} from '../utils/admin-users';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';

test('admin can create and accept a new user', async ({ adminPage }) => {
  // An unassigned apartment for the approval dialog to assign
  const apartment = await createUniqueUnassignedApartment();
  const email = `newuser-${Date.now()}@e2e-test.com`;

  await openUsersPage(adminPage);
  await createUser(adminPage, email, 'New Test User');

  const card = userCard(adminPage, email);
  await expect(card).toBeVisible({ timeout: 10000 });

  await approveWithApartment(
    adminPage,
    email,
    'ul. Testowa 1/2B',
    apartment.externalOwnerId
  );
  await showAllUsers(adminPage);

  await expect(card.getByText(/zatwierdzony/i)).toBeVisible({
    timeout: 10000,
  });
  await expect(card.getByText(/Przypisane mieszkania: 1/i)).toBeVisible({
    timeout: 10000,
  });
});
