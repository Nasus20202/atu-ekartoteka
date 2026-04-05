/**
 * Access control tests (redirects, permissions)
 */

import { expect, test } from '../fixtures';
import { createMustChangePasswordUser } from '../utils/create-must-change-password-user';

test.describe('Access Control', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('non-admin cannot access admin pages', async ({ userPage }) => {
    await userPage.goto('/admin/users');

    await expect(userPage).not.toHaveURL(/\/admin\/users/);
  });

  test('non-admin cannot access admin apartments page', async ({
    userPage,
  }) => {
    await userPage.goto('/admin/apartments');

    await expect(userPage).not.toHaveURL(/\/admin\/apartments/);
  });

  test('non-admin cannot access import page', async ({ userPage }) => {
    await userPage.goto('/admin/import');

    await expect(userPage).not.toHaveURL(/\/admin\/import/);
  });

  test('user without mustChangePassword cannot access /change-password', async ({
    userPage,
  }) => {
    await userPage.goto('/change-password');

    await userPage.waitForURL(
      (url) => !url.pathname.includes('/change-password'),
      {
        timeout: 10000,
      }
    );
    await expect(userPage).not.toHaveURL(/\/change-password/);
  });

  test.describe('mustChangePassword guard', () => {
    test.beforeEach(async () => {
      await createMustChangePasswordUser();
    });

    test('user with mustChangePassword is blocked from /dashboard until password is changed', async ({
      mustChangePasswordPage,
    }) => {
      await mustChangePasswordPage.waitForURL('**/change-password**', {
        timeout: 10000,
      });
      await expect(mustChangePasswordPage).toHaveURL(/\/change-password/);

      await mustChangePasswordPage.goto('/dashboard');

      await mustChangePasswordPage.waitForURL('**/change-password**', {
        timeout: 10000,
      });
      await expect(mustChangePasswordPage).toHaveURL(/\/change-password/);
    });
  });
});
