/**
 * Admin user list tests
 */

import { expect, test } from '../fixtures';
import { openAllUsers, searchUsers, userCard } from '../utils/admin-users';
import { USER_EMAIL } from '../utils/test-credentials';

test.describe.serial('Admin user list', () => {
  test('admin can view users list', async ({ adminPage }) => {
    await openAllUsers(adminPage);

    await expect(adminPage.getByText(USER_EMAIL)).toBeVisible({
      timeout: 10000,
    });
  });

  test('admin can search for a user by email', async ({ adminPage }) => {
    await openAllUsers(adminPage);

    await searchUsers(adminPage, USER_EMAIL);
    await expect(adminPage.getByText(USER_EMAIL)).toBeVisible({
      timeout: 5000,
    });

    await searchUsers(adminPage, 'nikt-taki-nie-istnieje@example.com');
    await expect(
      adminPage.getByText(
        /Nie znaleziono użytkowników pasujących do wyszukiwania/i
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('admin can view apartments for a specific user', async ({
    adminPage,
  }) => {
    await openAllUsers(adminPage);

    const card = userCard(adminPage, USER_EMAIL);
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.getByRole('button', { name: /Mieszkania/i }).click();

    await expect(adminPage.getByText(/Przypisz mieszkanie/i)).toBeVisible({
      timeout: 10000,
    });
    // The seeded user already has this apartment selected
    await expect(adminPage.getByText(/ul\. Testowa 1\/1A/i)).toBeVisible();
  });
});
