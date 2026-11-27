/**
 * Admin user list tests
 */

import { expect, test } from '../../fixtures';
import { openAllUsers, searchUsers, userCard } from '../../utils/admin-users';
import { USER_EMAIL } from '../../utils/test-credentials';

const ASSIGNABLE_APARTMENTS_DELAY_MS = 1500;
const ASSIGNABLE_APARTMENTS_URL = /\/api\/admin\/apartments\?.*assignableTo=/;

test.describe.serial('Admin user list', () => {
  test('admin can view users list', async ({ adminPage }) => {
    await openAllUsers(adminPage);

    await expect(
      adminPage.getByText(USER_EMAIL).filter({ visible: true })
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('admin can search for a user by email', async ({ adminPage }) => {
    await openAllUsers(adminPage);

    await searchUsers(adminPage, USER_EMAIL);
    await expect(
      adminPage.getByText(USER_EMAIL).filter({ visible: true })
    ).toBeVisible({
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
    await expect(
      adminPage
        .getByRole('dialog')
        .getByText(/ul\. Testowa 1\/1A/i)
        .first()
    ).toBeVisible();
  });

  test('assign dialog shows a spinner until the apartments load', async ({
    adminPage,
  }) => {
    await adminPage.route(ASSIGNABLE_APARTMENTS_URL, async (route) => {
      await new Promise((resolve) =>
        setTimeout(resolve, ASSIGNABLE_APARTMENTS_DELAY_MS)
      );
      await route.continue();
    });

    await openAllUsers(adminPage);
    const card = userCard(adminPage, USER_EMAIL);
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.getByRole('button', { name: /Mieszkania/i }).click();

    const dialog = adminPage.getByRole('dialog');
    await expect(dialog.getByRole('status')).toHaveText(/Ładowanie mieszkań/i);
    await expect(dialog.getByText(/ul\. Testowa 1\/1A/i).first()).toBeVisible();
    await expect(dialog.getByRole('status')).toHaveCount(0);

    await adminPage.unroute(ASSIGNABLE_APARTMENTS_URL);
  });
});
