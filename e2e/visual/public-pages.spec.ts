/**
 * Visual regression tests for pages available without logging in
 */

import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { stubVisibleTurnstileWidget } from '../utils/mock-server';

const googleButton = (page: Page) =>
  page.getByRole('button', { name: /Zaloguj się przez Google/i });

const fakeTurnstile = (page: Page) =>
  page.locator('[data-fake-turnstile="visible"]');

const PUBLIC_PAGES = ['register', 'forgot-password'] as const;

const NARROW_PHONE_VIEWPORT = { width: 360, height: 780 };
const MAX_EDGE_DRIFT_PX = 1;

const edges = (locator: Locator) =>
  locator.evaluate((el) => {
    const { left, right } = el.getBoundingClientRect();
    return { left, right };
  });

test.describe('Visual: public pages', () => {
  test.beforeEach(async ({ page }) => {
    // The visual app has a Turnstile site key; stub the script so the challenge
    // is rendered by us instead of Cloudflare and the snapshot stays stable
    await stubVisibleTurnstileWidget(page);
  });

  for (const name of PUBLIC_PAGES) {
    test(`${name} page`, async ({ page }) => {
      await page.goto(`/${name}`);
      // The form renders after the page loads its setup status, a spinner is not a stable state
      await expect(page.locator('form')).toBeVisible();
      await expect(fakeTurnstile(page)).toBeVisible();

      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(googleButton(page)).toBeVisible();
    await expect(fakeTurnstile(page)).toBeVisible();

    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('login page in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(googleButton(page)).toBeVisible();
    await expect(fakeTurnstile(page)).toBeVisible();

    await expect(page).toHaveScreenshot('login-dark.png', { fullPage: true });
  });

  test('widget spans the form width on a narrow phone', async ({ page }) => {
    await page.setViewportSize(NARROW_PHONE_VIEWPORT);
    await page.goto('/login');
    await expect(fakeTurnstile(page)).toBeVisible();

    const field = await edges(page.getByLabel('Hasło', { exact: true }));
    const widget = await edges(fakeTurnstile(page));

    expect(Math.abs(widget.left - field.left)).toBeLessThanOrEqual(
      MAX_EDGE_DRIFT_PX
    );
    expect(Math.abs(widget.right - field.right)).toBeLessThanOrEqual(
      MAX_EDGE_DRIFT_PX
    );
  });
});
