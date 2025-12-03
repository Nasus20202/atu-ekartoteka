/**
 * Profile management tests
 */

import { expect, test } from '../fixtures';
import { USER_PASSWORD } from '../utils/test-credentials';

test.describe.serial('Profile', () => {
  test('user can view profile page', async ({ userPage }) => {
    await userPage.goto('/dashboard/profile');

    // Should see profile heading
    await expect(
      userPage.getByRole('heading', { name: /Profil/i })
    ).toBeVisible();

    // Should see name input with some value (original or updated from previous test run)
    const nameInput = userPage.getByLabel(/Imię i nazwisko/i);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).not.toHaveValue('');
  });

  test('user can update their name', async ({ userPage }) => {
    await userPage.goto('/dashboard/profile');

    // Clear and fill new name
    const newName = `Updated User ${Date.now()}`;
    const nameInput = userPage.getByLabel(/Imię i nazwisko/i);
    await nameInput.clear();
    await nameInput.fill(newName);

    // Submit form
    await userPage.getByRole('button', { name: /Zapisz zmiany/i }).click();

    // Should show success message
    await expect(
      userPage.getByText(/zaktualizowany|zapisano|sukces/i)
    ).toBeVisible({ timeout: 10000 });

    // Reload and verify the name persisted
    await userPage.reload();
    await expect(userPage.locator(`input[value="${newName}"]`)).toBeVisible();
  });

  test('user can change password', async ({ userPage }) => {
    await userPage.goto('/dashboard/profile');

    // Change password to the same value (non-destructive)
    await userPage.getByLabel('Obecne hasło').fill(USER_PASSWORD);
    await userPage
      .getByLabel('Nowe hasło', { exact: true })
      .fill(USER_PASSWORD);
    await userPage.getByLabel('Potwierdź nowe hasło').fill(USER_PASSWORD);

    // Submit
    await userPage.getByRole('button', { name: /Zapisz zmiany/i }).click();

    // Should show success message
    await expect(
      userPage.getByText(/zaktualizowany|zapisano|sukces/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
