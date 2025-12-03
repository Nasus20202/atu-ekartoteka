/**
 * Access control tests (redirects, permissions)
 */

import { expect, test } from '../fixtures';

test.describe('Access Control', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForURL('**/login**', { timeout: 10000 });
  });

  test('non-admin cannot access admin pages', async ({ userPage }) => {
    await userPage.goto('/admin/users');

    // Should be redirected or show error
    await expect(userPage).not.toHaveURL(/\/admin\/users/);
  });

  test('non-admin cannot access admin apartments page', async ({
    userPage,
  }) => {
    await userPage.goto('/admin/apartments');

    // Should be redirected or show error
    await expect(userPage).not.toHaveURL(/\/admin\/apartments/);
  });

  test('non-admin cannot access import page', async ({ userPage }) => {
    await userPage.goto('/admin/import');

    // Should be redirected or show error
    await expect(userPage).not.toHaveURL(/\/admin\/import/);
  });
});
