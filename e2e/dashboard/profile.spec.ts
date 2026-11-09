/**
 * Profile management tests
 */

import { expect, test } from '../fixtures';
import { PROFILE_PASSWORD } from '../utils/test-credentials';

test.describe.serial('Profile', () => {
  test('user can view profile page', async ({ profilePage }) => {
    await profilePage.goto('/dashboard/profile');

    // Should see profile heading
    await expect(
      profilePage.getByRole('heading', { name: /Profil/i })
    ).toBeVisible();

    // Should see name input with some value (original or updated from previous test run)
    const nameInput = profilePage.getByLabel(/Imię i nazwisko/i);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).not.toHaveValue('');
  });

  test('user can update their name', async ({ profilePage }) => {
    await profilePage.goto('/dashboard/profile');

    // Clear and fill new name
    const newName = `Updated User ${Date.now()}`;
    const nameInput = profilePage.getByLabel(/Imię i nazwisko/i);
    await nameInput.clear();
    await nameInput.fill(newName);

    // Submit form
    await profilePage.getByRole('button', { name: /Zapisz zmiany/i }).click();

    // Should show success message
    await expect(
      profilePage.getByText(/zaktualizowany|zapisano|sukces/i)
    ).toBeVisible({ timeout: 10000 });

    // Load the page again and verify the name persisted; goto() tolerates the
    // navigation the save may still be finishing, which aborts a reload
    await profilePage.goto('/dashboard/profile');
    await expect(
      profilePage.locator(`input[value="${newName}"]`).filter({ visible: true })
    ).toBeVisible();
  });

  test('user can change password', async ({ profilePage }) => {
    await profilePage.goto('/dashboard/profile');

    // Change password to the same value (non-destructive)
    await profilePage.getByLabel('Obecne hasło').fill(PROFILE_PASSWORD);
    await profilePage
      .getByLabel('Nowe hasło', { exact: true })
      .fill(PROFILE_PASSWORD);
    await profilePage.getByLabel('Potwierdź nowe hasło').fill(PROFILE_PASSWORD);

    // Submit
    await profilePage.getByRole('button', { name: /Zapisz zmiany/i }).click();

    // Should show success message
    await expect(
      profilePage.getByText(/zaktualizowany|zapisano|sukces/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
