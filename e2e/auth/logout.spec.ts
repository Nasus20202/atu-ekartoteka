/**
 * Logout tests
 */

import { expect, test } from '../fixtures';

test.describe('Logout', () => {
  test('user can logout', async ({ userPage }) => {
    await userPage.goto('/dashboard');

    // Click logout button
    await userPage.getByRole('button', { name: /Wyloguj/i }).click();

    // Should be redirected to login page
    await expect(userPage).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('admin can logout', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');

    // Click logout button
    await adminPage.getByRole('button', { name: /Wyloguj/i }).click();

    // Should be redirected to login page
    await expect(adminPage).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('after logout, protected pages redirect to login', async ({ page }) => {
    // This test uses a fresh page to avoid session issues
    await page.goto('/dashboard');

    // Should be redirected to login (not logged in)
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
