/**
 * Password reset (forgot password) tests
 */

import { expect, test } from '../fixtures';
import { createResetToken } from '../utils/create-reset-token';
import {
  RESET_TOKEN,
  USER_EMAIL,
  USER_PASSWORD,
} from '../utils/test-credentials';

test.describe.serial('Password Reset', () => {
  test('user can access forgot password page', async ({ page }) => {
    await page.goto('/login');

    // Click forgot password link
    await page
      .getByRole('link', { name: /Przywracanie hasła|Zapomniałem/i })
      .click();

    // Should be on forgot password page
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText('Przywracanie hasła')).toBeVisible();
  });

  test('user can request password reset', async ({ page }) => {
    await page.goto('/forgot-password');

    // Fill email
    await page.getByLabel('Email').fill(USER_EMAIL);

    // Submit
    await page
      .getByRole('button', { name: /Wyślij link resetowania/i })
      .click();

    // Should show success message (email sent)
    await expect(page.getByText(/wysłano|sprawdź|link/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('user can reset password with valid token', async ({ page }) => {
    // Create a fresh token before this test
    await createResetToken();

    // Navigate to reset page with the seeded token
    await page.goto(`/reset-password?token=${RESET_TOKEN}`);

    // Should see reset password form
    await expect(page.getByText('Ustaw nowe hasło')).toBeVisible();

    // Fill new password (use the same password to keep tests working)
    await page.getByLabel('Nowe hasło').fill(USER_PASSWORD);
    await page.getByLabel('Potwierdź hasło').fill(USER_PASSWORD);

    // Submit
    await page.getByRole('button', { name: /Zresetuj hasło/i }).click();

    // Should show success or redirect to login
    await expect(
      page.getByText(/Hasło.*zmienione|sukces|zaloguj/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('invalid token shows error', async ({ page }) => {
    // Navigate to reset page with invalid token
    await page.goto('/reset-password?token=invalid-token-12345');

    // Fill new password
    await page.getByLabel('Nowe hasło').fill('NewPassword123!');
    await page.getByLabel('Potwierdź hasło').fill('NewPassword123!');

    // Submit
    await page.getByRole('button', { name: /Zresetuj hasło/i }).click();

    // Should show error
    await expect(page.getByText(/nieprawidłowy|wygasły|błąd/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
