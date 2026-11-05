/**
 * Visual regression tests for pages available without logging in
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';

const googleButton = (page: Page) =>
  page.getByRole('button', { name: /Zaloguj się przez Google/i });

const PUBLIC_PAGES = ['register', 'forgot-password'] as const;

test.describe('Visual: public pages', () => {
  for (const name of PUBLIC_PAGES) {
    test(`${name} page`, async ({ page }) => {
      await page.goto(`/${name}`);
      // The form renders after the page loads its setup status, a spinner is not a stable state
      await expect(page.locator('form')).toBeVisible();

      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(googleButton(page)).toBeVisible();

    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('login page in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(googleButton(page)).toBeVisible();

    await expect(page).toHaveScreenshot('login-dark.png', { fullPage: true });
  });
});
