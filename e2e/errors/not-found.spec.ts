/**
 * Not-found pages for unknown addresses and records
 */

import { expect, test } from '../fixtures';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Not-found pages', () => {
  test('unknown URL shows the global 404 page', async ({ page }) => {
    await page.goto('/no-such-page');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
    await expect(
      page.getByRole('link', { name: 'Powrót do strony głównej' })
    ).toHaveAttribute('href', '/dashboard');
  });

  test('unknown apartment shows the charges 404 inside the dashboard', async ({
    userPage,
  }) => {
    await userPage.goto(`/dashboard/charges/${MISSING_ID}`);

    await expect(
      userPage.getByRole('heading', { name: 'Naliczenia nie znalezione' })
    ).toBeVisible();
    await userPage.getByRole('link', { name: 'Powrót do naliczeń' }).click();
    await expect(userPage).toHaveURL(/\/dashboard\/charges$/);
  });

  test('unknown apartment shows the payments 404', async ({ userPage }) => {
    await userPage.goto(`/dashboard/payments/${MISSING_ID}/2026`);

    await expect(
      userPage.getByRole('heading', { name: 'Wpłaty nie znalezione' })
    ).toBeVisible();
    await userPage.getByRole('link', { name: 'Powrót do wpłat' }).click();
    await expect(userPage).toHaveURL(/\/dashboard\/payments$/);
  });

  test('invalid payment year shows the payments 404', async ({ userPage }) => {
    await userPage.goto(`/dashboard/payments/${MISSING_ID}/not-a-year`);

    await expect(
      userPage.getByRole('heading', { name: 'Wpłaty nie znalezione' })
    ).toBeVisible();
  });
});
