/**
 * Visual regression tests for tenant pages (see seed-visual-test-data.ts)
 */

import { expect, test } from '../fixtures';
import { VISUAL_YEAR } from '../utils/test-credentials';

// Charges months start collapsed, so open the last seeded one to show its details
const CHARGES_MONTH_QUERY = `?month=${VISUAL_YEAR}-12`;

test.describe('Visual: tenant pages', () => {
  test('dashboard', async ({ visualPage }) => {
    await visualPage.goto('/dashboard');

    await expect(visualPage).toHaveScreenshot('dashboard.png', {
      fullPage: true,
    });
  });

  test('dashboard in dark mode', async ({ visualPage }) => {
    await visualPage.emulateMedia({ colorScheme: 'dark' });
    await visualPage.goto('/dashboard');

    await expect(visualPage).toHaveScreenshot('dashboard-dark.png', {
      fullPage: true,
    });
  });

  test('dashboard does not overflow horizontally', async ({ visualPage }) => {
    await visualPage.goto('/dashboard');

    // On mobile, window.innerWidth grows with the content, so compare with the device viewport
    const scrollWidth = await visualPage.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(visualPage.viewportSize()!.width);
  });

  test('charges list and details', async ({ visualPage }) => {
    await visualPage.goto(`/dashboard/charges${CHARGES_MONTH_QUERY}`);
    await expect(visualPage).toHaveScreenshot('charges.png', {
      fullPage: true,
    });

    // Open links directly, client-side navigation keeps the scroll position
    await visualPage.goto('/dashboard');
    const chargesHref = await visualPage
      .getByRole('link', { name: 'Naliczenia', exact: true })
      .getAttribute('href');
    await visualPage.goto(`${chargesHref}${CHARGES_MONTH_QUERY}`);
    await expect(visualPage).toHaveURL(/\/dashboard\/charges\/[\w-]+/);
    await expect(visualPage).toHaveScreenshot('charges-details.png', {
      fullPage: true,
    });
  });

  test('payments list and year details', async ({ visualPage }) => {
    await visualPage.goto('/dashboard/payments');
    await expect(visualPage).toHaveScreenshot('payments.png', {
      fullPage: true,
    });

    const yearHref = await visualPage
      .getByRole('link', { name: new RegExp(`Rok ${VISUAL_YEAR}`) })
      .getAttribute('href');
    await visualPage.goto(yearHref!);
    await expect(visualPage).toHaveURL(/\/dashboard\/payments\/[\w-]+\/\d{4}/);
    await expect(visualPage).toHaveScreenshot('payments-year.png', {
      fullPage: true,
    });
  });

  test('profile', async ({ visualPage }) => {
    await visualPage.goto('/dashboard/profile');

    await expect(visualPage).toHaveScreenshot('profile.png', {
      fullPage: true,
    });
  });
});
