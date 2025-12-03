/**
 * Registration tests and validation
 */

import { expect, test } from '../fixtures';

test.describe('Registration', () => {
  test('new user can create an account', async ({ page }) => {
    const uniqueEmail = `newuser-${Date.now()}@e2e-test.com`;
    const password = 'SecurePassword123!';
    const name = 'New Test User';

    await page.goto('/register');

    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Imię i nazwisko').fill(name);
    await page.getByLabel('Hasło', { exact: true }).fill(password);
    await page.getByLabel('Potwierdź hasło').fill(password);
    await page.getByRole('button', { name: /Zarejestruj się/i }).click();

    // Should redirect to login page with success message
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(
      page.getByText(/Konto utworzone|Account created/i)
    ).toBeVisible();
  });

  test.describe('Validation', () => {
    test('mismatched passwords show error', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel('Email').fill('mismatch@test.com');
      await page.getByLabel('Hasło', { exact: true }).fill('Password123!');
      await page.getByLabel('Potwierdź hasło').fill('DifferentPassword123!');
      await page.getByRole('button', { name: /Zarejestruj się/i }).click();

      await expect(page.getByText(/Hasła nie są identyczne/i)).toBeVisible();
    });

    test('short password shows error', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel('Email').fill('short@test.com');
      await page.getByLabel('Hasło', { exact: true }).fill('short');
      await page.getByLabel('Potwierdź hasło').fill('short');
      await page.getByRole('button', { name: /Zarejestruj się/i }).click();

      await expect(
        page.getByText(/Hasło musi mieć co najmniej 8 znaków/i)
      ).toBeVisible();
    });
  });
});
