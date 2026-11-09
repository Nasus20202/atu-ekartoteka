/**
 * Login tests for admin and user roles
 */

import { expect, login, test } from '../fixtures';
import {
  ADMIN_NAME,
  USER_EMAIL,
  USER_NAME,
  USER_PASSWORD,
} from '../utils/test-credentials';

test.describe('Login', () => {
  test.describe('Admin', () => {
    test('admin can login and access dashboard', async ({ adminPage }) => {
      await adminPage.goto('/dashboard');

      // Should show welcome message
      await expect(
        adminPage
          .getByText(new RegExp(`Witaj.*${ADMIN_NAME}`, 'i'))
          .filter({ visible: true })
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
        userPage
          .getByText(new RegExp(`Witaj.*${USER_NAME}`, 'i'))
          .filter({ visible: true })
      ).toBeVisible();
    });

    test('user can login with the email in a different casing', async ({
      page,
    }) => {
      await login(page, USER_EMAIL.toUpperCase(), USER_PASSWORD);

      await expect(page).toHaveURL(/\/dashboard/);
      await expect(
        page.getByRole('heading', {
          name: new RegExp(`Witaj.*${USER_NAME}`, 'i'),
        })
      ).toBeVisible();
    });

    test('user can see their apartment', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see apartment info (seeded data - ul. Testowa 1/1A)
      await expect(
        userPage.getByText('ul. Testowa 1/1A').filter({ visible: true }).first()
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

  test.describe('Public form', () => {
    test('shows instructional placeholders and reveals the password', async ({
      page,
    }) => {
      await page.goto('/login');

      await expect(page.getByLabel('Email')).toHaveAttribute(
        'placeholder',
        'Wprowadź adres e-mail'
      );
      const password = page.getByLabel('Hasło', { exact: true });
      await expect(password).toHaveAttribute('placeholder', 'Wprowadź hasło');
      await expect(password).toHaveAttribute('type', 'password');

      await page.getByRole('button', { name: 'Pokaż hasło' }).click();

      await expect(password).toHaveAttribute('type', 'text');
      await expect(
        page.getByRole('button', { name: 'Ukryj hasło' })
      ).toBeVisible();
    });

    test('a tap near the trailing edge of the password field toggles it', async ({
      page,
    }) => {
      await page.goto('/login');

      const password = page.getByLabel('Hasło', { exact: true });
      const rect = await password.evaluate((field) => {
        const { x, y, width, height } = field.getBoundingClientRect();
        return { x, y, width, height };
      });

      // Taps just inside the field's right edge must reach the toggle, not focus the input
      await page.mouse.click(rect.x + rect.width - 6, rect.y + rect.height / 2);

      await expect(password).toHaveAttribute('type', 'text');
      await expect(password).not.toBeFocused();
    });

    test('keeps submit before the secondary options and registration', async ({
      page,
    }) => {
      await page.goto('/login');

      const submit = page.getByRole('button', {
        name: 'Zaloguj się',
        exact: true,
      });
      const register = page.getByRole('link', { name: 'Zarejestruj się' });
      await expect(submit).toBeVisible();
      await expect(register).toBeVisible();

      const submitBox = await submit.boundingBox();
      const registerBox = await register.boundingBox();
      expect(
        Boolean(submitBox && registerBox && submitBox.y < registerBox.y)
      ).toBe(true);

      // Google sign-in is disabled in this environment, so the divider collapses
      await expect(page.getByText('Lub')).toHaveCount(0);
    });

    test('serves a browser-cacheable public config', async ({ request }) => {
      const response = await request.get('/api/config/turnstile');

      expect(response.ok()).toBe(true);
      expect(response.headers()['cache-control']).toBe('public, max-age=300');
    });
  });
});
