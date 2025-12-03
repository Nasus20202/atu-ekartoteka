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
      await expect(userPage.getByText('-444.25 zł')).toBeVisible();
    });
  });

  test.describe('Payments Per Apartment Per Year', () => {
    test('user can view payments for specific apartment and year', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // Click on year row to see detailed payments
      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).click();

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
      await userPage.getByText(`Rok ${currentYear}`).click();

      // Should see monthly data - use first() to avoid strict mode
      await expect(userPage.getByText(/Styczeń/i).first()).toBeVisible();
    });

    test('apartment payments page shows charges and payments columns', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      // Navigate to specific apartment/year
      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).click();

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
      await userPage.getByText(`Rok ${currentYear}`).click();

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
      await userPage.getByText(`Rok ${currentYear}`).click();

      // Should see seeded monthly amounts (444.25 for each month)
      await expect(userPage.getByText(/444/)).toBeVisible();
    });
  });
});
