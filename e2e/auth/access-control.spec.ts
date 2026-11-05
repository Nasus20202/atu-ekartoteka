/**
 * Access control tests (redirects, permissions)
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { createMustChangePasswordUser } from '../utils/create-must-change-password-user';

const DASHBOARD_PATH = '/dashboard';
const REDIRECT_STATUS = 307;

/**
 * Reads the server's redirect without following it. Browsers abort goto()
 * when a redirect interrupts it (Firefox), so the response is the
 * reliable signal.
 */
async function getRedirect(page: Page, path: string) {
  const response = await page.request.get(path, { maxRedirects: 0 });

  return {
    status: response.status(),
    pathname: new URL(response.headers().location, page.url()).pathname,
  };
}

test.describe('Access Control', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('non-admin cannot access admin pages', async ({ userPage }) => {
    expect(await getRedirect(userPage, '/admin/users')).toEqual({
      status: REDIRECT_STATUS,
      pathname: DASHBOARD_PATH,
    });
  });

  test('non-admin cannot access admin apartments page', async ({
    userPage,
  }) => {
    expect(await getRedirect(userPage, '/admin/apartments')).toEqual({
      status: REDIRECT_STATUS,
      pathname: DASHBOARD_PATH,
    });
  });

  test('non-admin cannot access import page', async ({ userPage }) => {
    expect(await getRedirect(userPage, '/admin/import')).toEqual({
      status: REDIRECT_STATUS,
      pathname: DASHBOARD_PATH,
    });
  });

  test('user without mustChangePassword cannot access /change-password', async ({
    userPage,
  }) => {
    expect(await getRedirect(userPage, '/change-password')).toEqual({
      status: REDIRECT_STATUS,
      pathname: DASHBOARD_PATH,
    });
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
