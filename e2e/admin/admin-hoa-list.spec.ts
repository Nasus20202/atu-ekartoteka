/**
 * Admin HOA list tests
 */

import { expect, test } from '../fixtures';
import {
  cardWithText,
  openHoaApartments,
  openHoaList,
  TEST_HOA,
} from '../utils/admin-apartments';
import { setHoaImportDates } from '../utils/set-hoa-import-dates';

test.describe('Admin HOA list', () => {
  test('admin can view HOA list', async ({ adminPage }) => {
    await adminPage.goto('/admin/apartments');

    await expect(
      adminPage.getByRole('heading', { name: /Mieszkania|Wspólnoty/i })
    ).toBeVisible();
  });

  test('admin sees seeded HOA', async ({ adminPage }) => {
    await openHoaList(adminPage);

    await expect(
      adminPage.getByRole('heading', { name: /Mieszkania|Wspólnoty/i })
    ).toBeVisible();
  });

  test('HOA card shows apartment count', async ({ adminPage }) => {
    await openHoaList(adminPage);

    const hoaCard = cardWithText(adminPage, TEST_HOA);
    await expect(hoaCard).toBeVisible();
    await expect(hoaCard.getByText(/\d+/).first()).toBeVisible();
  });

  test('admin can click to view apartments in HOA', async ({ adminPage }) => {
    await openHoaApartments(adminPage);

    await expect(adminPage).toHaveURL(/\/admin\/apartments\/[a-f0-9-]+/);
  });

  test('HOA card shows import dates when set', async ({ adminPage }) => {
    await setHoaImportDates('2025-03-15T00:00:00.000Z');

    try {
      await openHoaList(adminPage);
      const hoaCard = cardWithText(adminPage, TEST_HOA);

      // Dates should appear in Polish locale format (15.03.2025)
      await expect(hoaCard.getByText(/Mieszkania:/i)).toBeVisible({
        timeout: 5000,
      });
      await expect(hoaCard.getByText(/Naliczenia:/i)).toBeVisible();
      await expect(hoaCard.getByText(/Powiadomienia:/i)).toBeVisible();
    } finally {
      await setHoaImportDates(null);
    }
  });
});
