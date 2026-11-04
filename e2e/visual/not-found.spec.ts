/**
 * Visual regression tests for not-found pages
 */

import { expect, test } from '../fixtures';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Visual: not-found pages', () => {
  test('global 404', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');

    await expect(page).toHaveScreenshot('not-found.png', { fullPage: true });
  });

  test('apartment 404 for a tenant', async ({ visualPage }) => {
    await visualPage.goto(`/dashboard/charges/${MISSING_ID}`);
    await expect(
      visualPage.getByRole('heading', { name: 'Naliczenia nie znalezione' })
    ).toBeVisible();

    // The app header is outside the not-found design and differs between runners
    await expect(visualPage.locator('main')).toHaveScreenshot(
      'apartment-not-found.png'
    );
  });

  test('payments 404 for a tenant', async ({ visualPage }) => {
    await visualPage.goto(`/dashboard/payments/${MISSING_ID}/2024`);
    await expect(
      visualPage.getByRole('heading', { name: 'Wpłaty nie znalezione' })
    ).toBeVisible();

    // The app header is outside the not-found design and differs between runners
    await expect(visualPage.locator('main')).toHaveScreenshot(
      'payments-not-found.png'
    );
  });
});
