/**
 * Login tests for admin and user roles
 */

import { expect, test } from '../fixtures';
import { ADMIN_NAME, USER_NAME } from '../utils/test-credentials';

test.describe('Login', () => {
  test.describe('Admin', () => {
    test('admin can login and access dashboard', async ({ adminPage }) => {
      await adminPage.goto('/dashboard');

      // Should show welcome message
      await expect(
        adminPage.getByText(new RegExp(`Witaj.*${ADMIN_NAME}`, 'i'))
      ).toBeVisible();
    });

    test('admin can access admin panel', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      // Should see users page
      await expect(
        adminPage.getByRole('heading', { name: /Użytkownicy/i })
      ).toBeVisible();
    });

    test('admin can access apartments page', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Page shows "Wspólnoty mieszkaniowe" (HOAs) heading
      await expect(
        adminPage.getByRole('heading', { name: /Wspólnoty mieszkaniowe/i })
      ).toBeVisible();
    });
  });

  test.describe('User', () => {
    test('user can login and see dashboard', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should show welcome message
      await expect(
        userPage.getByText(new RegExp(`Witaj.*${USER_NAME}`, 'i'))
      ).toBeVisible();
    });

    test('user can see their apartment', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see apartment info (seeded data - ul. Testowa 1/1A)
      await expect(
        userPage.getByText('ul. Testowa 1/1A').first()
      ).toBeVisible();
    });
  });

  test.describe('Validation', () => {
    test('invalid credentials show error', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill('nonexistent@test.com');
      await page.getByLabel('Hasło', { exact: true }).fill('wrongpassword');
      await page
        .getByRole('button', { name: 'Zaloguj się', exact: true })
        .click();

      await expect(
        page.getByText(/Nieprawidłowy email lub hasło/i)
      ).toBeVisible();
    });
  });
});
