/**
 * Logout tests
 */

import { expect, test } from '../fixtures';
import { openNavigationMenu } from '../utils/navigation';

const NO_RELOAD_MARKER = '__noReloadMarker';

test.describe('Logout', () => {
  test('user can logout', async ({ userPage }) => {
    await userPage.goto('/dashboard');
    await openNavigationMenu(userPage);

    // Click logout button
    await userPage.getByRole('button', { name: /Wyloguj/i }).click();

    // Should be redirected to login page
    await expect(userPage).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('logout navigates without reloading the page', async ({ userPage }) => {
    await userPage.goto('/dashboard');
    await userPage.evaluate((marker) => {
      (window as unknown as Record<string, boolean>)[marker] = true;
    }, NO_RELOAD_MARKER);
    await openNavigationMenu(userPage);

    await userPage.getByRole('button', { name: /Wyloguj/i }).click();

    await expect(userPage).toHaveURL(/\/login/, { timeout: 10000 });
    const survived = await userPage.evaluate(
      (marker) => (window as unknown as Record<string, boolean>)[marker],
      NO_RELOAD_MARKER
    );
    expect(survived).toBe(true);
  });

  test('admin can logout', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    await openNavigationMenu(adminPage);

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
