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

    // Load the page again and verify the name persisted. The refresh the save
    // starts can abort the reload, so retry until the page shows the new name
    await expect(async () => {
      await profilePage.goto('/dashboard/profile');
      await expect(
        profilePage
          .locator(`input[value="${newName}"]`)
          .filter({ visible: true })
      ).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 20_000 });
  });

  test('user can change password', async ({ profilePage }) => {
    await profilePage.goto('/dashboard/profile');

    const currentPassword = profilePage.getByLabel('Obecne hasło');
    const newPassword = profilePage.getByLabel('Nowe hasło', { exact: true });
    const confirmPassword = profilePage.getByLabel('Potwierdź nowe hasło');
    const submit = profilePage.getByRole('button', { name: /Zapisz zmiany/i });
    const success = profilePage.getByText(/zaktualizowany|zapisano|sukces/i);

    // A fill that lands before React hydrates updates the DOM without updating
    // the form state, and the next render clears it, so retry the whole submit
    await expect(async () => {
      await currentPassword.fill(PROFILE_PASSWORD);
      await newPassword.fill(PROFILE_PASSWORD);
      await confirmPassword.fill(PROFILE_PASSWORD);
      await submit.click();
      await expect(success).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 20_000 });
  });
});
