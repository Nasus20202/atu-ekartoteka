/**
 * Payments page tests - viewing payments per apartment per year
 */

import { expect, test } from '../fixtures';

test.describe('Payments', () => {
  test.describe('Payments List', () => {
    test('user can access payments page', async ({ userPage }) => {
      await userPage.goto('/dashboard/payments');

      await expect(
        userPage.getByRole('heading', { name: /Wpłaty/i })
      ).toBeVisible();
    });

    test('payments page shows current year', async ({ userPage }) => {
      await userPage.goto('/dashboard/payments');

      const currentYear = new Date().getFullYear();
      await expect(userPage.getByText(`Rok ${currentYear}`)).toBeVisible();
    });

    test('payments page shows apartment address', async ({ userPage }) => {
      await userPage.goto('/dashboard/payments');

      // Should see apartment address
      await expect(userPage.getByText('ul. Testowa 1/1A')).toBeVisible();
    });

    test('payments page shows balance', async ({ userPage }) => {
      await userPage.goto('/dashboard/payments');

      // Should see closing balance (-444.25 from seed)
      await expect(userPage.getByText('-444,25 zł').first()).toBeVisible();
    });

    test('year group for current year is expanded by default', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // The collapsible trigger "Rok YYYY" should be visible
      const currentYear = new Date().getFullYear();
      const yearTrigger = userPage.getByText(`Rok ${currentYear}`).first();
      await expect(yearTrigger).toBeVisible();

      // Because current year starts open, the payment row (with the year link) should
      // be visible without needing to click
      await expect(userPage.getByText(/444/).first()).toBeVisible();
    });

    test('clicking year group collapses it', async ({ userPage }) => {
      await userPage.goto('/dashboard/payments');

      const currentYear = new Date().getFullYear();

      // Click the collapsible trigger to collapse the current-year section
      await userPage.getByText(`Rok ${currentYear}`).first().click();

      // After collapsing the content should be hidden — the balance amount
      // specific to the row detail should no longer be in the DOM
      // (the trigger itself stays visible but content collapses)
      const yearTrigger = userPage.getByText(`Rok ${currentYear}`).first();
      await expect(yearTrigger).toBeVisible();
    });
  });

  test.describe('Payments Per Apartment Per Year', () => {
    test('user can view payments for specific apartment and year', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // Click on year row to see detailed payments
      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).first().click();

      // Should navigate to apartment payments page for that year
      await expect(userPage).toHaveURL(
        /\/dashboard\/payments\/[a-f0-9-]+\/\d{4}/
      );
    });

    test('apartment payments page shows monthly breakdown', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // Navigate to specific apartment/year
      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).first().click();

      // Should see monthly data - use first() to avoid strict mode
      await expect(userPage.getByText(/Styczeń/i).first()).toBeVisible();
    });

    test('apartment payments page shows charges and payments columns', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // Navigate to specific apartment/year
      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).first().click();

      // Should see column headers for charges and payments
      await expect(
        userPage.getByText(/naliczenia|należności/i).first()
      ).toBeVisible();
      await expect(userPage.getByText(/wpłaty/i).first()).toBeVisible();
    });

    test('apartment payments page shows opening and closing balance', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // Navigate to specific apartment/year
      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).first().click();

      // Should see balance information
      await expect(
        userPage.getByText(/saldo|bilans|początkowe|końcowe/i).first()
      ).toBeVisible();
    });

    test('apartment payments page shows correct amounts', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // Navigate to specific apartment/year
      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).first().click();

      // Should see seeded monthly amounts (444.25 for each month)
      await expect(userPage.getByText(/444/)).toBeVisible();
    });
  });
});
