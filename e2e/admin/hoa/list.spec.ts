/**
 * Admin HOA list tests
 */

import { expect, test } from '../../fixtures';
import {
  cardWithText,
  openHoaApartments,
  openHoaList,
  TEST_HOA,
} from '../../utils/admin-apartments';
import { setHoaImportDates } from '../../utils/set-hoa-import-dates';
import {
  addImportApartment,
  createImportHoa,
  deleteImportHoa,
} from '../../utils/settlement-import-hoa';

test.describe('Admin HOA list', () => {
  test('admin sees seeded HOA', async ({ adminPage }) => {
    await openHoaList(adminPage);

    await expect(
      adminPage.getByRole('heading', { name: /Mieszkania|Wspólnoty/i })
    ).toBeVisible();
  });

  test('HOA card counts the active apartments', async ({ adminPage }) => {
    const hoa = await createImportHoa();
    try {
      await addImportApartment(hoa, 'Pierwszy');
      await addImportApartment(hoa, 'Drugi');
      await addImportApartment(hoa, 'Nieaktywny', { isActive: false });

      await adminPage.goto('/admin/apartments');

      const hoaCard = cardWithText(adminPage, hoa.externalId);
      await expect(hoaCard.getByText('2', { exact: true })).toBeVisible();
      await expect(
        hoaCard.getByText('mieszkania', { exact: true })
      ).toBeVisible();
    } finally {
      await deleteImportHoa(hoa);
    }
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
