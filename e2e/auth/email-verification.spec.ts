/**
 * Email verification tests
 */

import { expect, test } from '../fixtures';
import { createVerificationToken } from '../utils/create-verification-token';
import { VERIFICATION_CODE } from '../utils/test-credentials';

test.describe('Email Verification', () => {
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
