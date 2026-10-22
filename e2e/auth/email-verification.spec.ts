/**
 * Email verification tests
 */

import { expect, test } from '../fixtures';
import { createVerificationToken } from '../utils/create-verification-token';
import {
  UNVERIFIED_EMAIL,
  UNVERIFIED_PASSWORD,
  VERIFICATION_CODE,
} from '../utils/test-credentials';

test.describe('Email Verification', () => {
  // Tests share one user and verification token, so they must not overlap
  test.describe.configure({ mode: 'serial' });

  test('user can verify email with valid token', async ({ page }) => {
    // Create fresh verification token
    await createVerificationToken();

    // Navigate to verification page with token
    await page.goto(`/verify-email?token=${VERIFICATION_CODE}`);

    // Should show success message "Email zweryfikowany!"
    await expect(page.getByText('Email zweryfikowany!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('logged-in user is redirected to dashboard without the verification banner', async ({
    page,
  }) => {
    await createVerificationToken();

    await page.goto('/login');
    await page.getByLabel('Email').fill(UNVERIFIED_EMAIL);
    await page.getByLabel('Hasło', { exact: true }).fill(UNVERIFIED_PASSWORD);
    await page
      .getByRole('button', { name: 'Zaloguj się', exact: true })
      .click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 10000,
    });

    const banner = page.getByText('Twój adres email wymaga weryfikacji');
    await page.goto('/dashboard');
    await expect(banner).toBeVisible();

    await page.goto(`/verify-email?token=${VERIFICATION_CODE}`);
    await expect(page.getByText('Email zweryfikowany!')).toBeVisible();
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });

    await expect(page.getByText(/Witaj/i).first()).toBeVisible();
    await expect(banner).toBeHidden();
  });

  test('invalid verification token shows error', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-token-12345');

    // Should show error message "Błąd weryfikacji"
    await expect(page.getByText('Błąd weryfikacji')).toBeVisible({
      timeout: 10000,
    });
  });

  test('verification page without token shows error', async ({ page }) => {
    await page.goto('/verify-email');

    // Should show error about missing token
    await expect(page.getByText(/Brak tokenu/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
