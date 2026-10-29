/**
 * Visual regression tests for pages available without logging in
 */

import { expect, test } from '../fixtures';

const PUBLIC_PAGES = ['login', 'register', 'forgot-password'] as const;

test.describe('Visual: public pages', () => {
  for (const name of PUBLIC_PAGES) {
    test(`${name} page`, async ({ page }) => {
      await page.goto(`/${name}`);

      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }

  test('login page in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');

    await expect(page).toHaveScreenshot('login-dark.png', { fullPage: true });
  });
});
