/**
 * Charges page tests - viewing charges per apartment
 */

import { expect, test } from '../fixtures';
import { CURRENT_MONTH_YEAR } from '../utils/date-utils';

test.describe('Charges', () => {
  test.describe('Charges List', () => {
    test('user can access charges page', async ({ userPage }) => {
      await userPage.goto('/dashboard/charges');

      await expect(
        userPage.getByRole('heading', { name: /Naliczenia/i })
      ).toBeVisible();
    });

    test('charges page shows charge items', async ({ userPage }) => {
      await userPage.goto('/dashboard/charges');

      // Should see seeded charge descriptions
      await expect(
        userPage.getByText(/Zarządzanie Nieruchomością/i)
      ).toBeVisible();
      await expect(userPage.getByText(/eksploatacja/i)).toBeVisible();
      await expect(userPage.getByText(/Fundusz remontowy/i)).toBeVisible();
    });

    test('charges page shows amounts', async ({ userPage }) => {
      await userPage.goto('/dashboard/charges');

      // Should see seeded amounts (73.00, 245.00, 126.25)
      await expect(userPage.getByText('73,00 zł').first()).toBeVisible();
      await expect(userPage.getByText('245,00 zł').first()).toBeVisible();
      await expect(userPage.getByText('126,25 zł').first()).toBeVisible();
    });

    test('charges page shows total', async ({ userPage }) => {
      await userPage.goto('/dashboard/charges');

      // Total should be 73 + 245 + 126.25 = 444.25
      await expect(userPage.getByText('444,25 zł').first()).toBeVisible();
    });
  });

  test.describe('Charges Details', () => {
    test('charges page shows apartment address', async ({ userPage }) => {
      await userPage.goto('/dashboard/charges');

      // Should see apartment address
      await expect(
        userPage.getByText('ul. Testowa 1/1A').first()
      ).toBeVisible();
    });

    test('charges page shows period information', async ({ userPage }) => {
      await userPage.goto('/dashboard/charges');

      // Should see current period
      await expect(
        userPage.getByText(new RegExp(CURRENT_MONTH_YEAR, 'i')).first()
      ).toBeVisible();
    });

    test('charges page shows quantity and unit info', async ({ userPage }) => {
      await userPage.goto('/dashboard/charges');

      // Should see quantity info (e.g., 50.5 m2 for fundusz remontowy)
      await expect(userPage.getByText(/50[,.]5/).first()).toBeVisible();
    });
  });
});
