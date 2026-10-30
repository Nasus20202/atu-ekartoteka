/**
 * Admin apartment details tests
 */

import { expect, test } from '../fixtures';
import { openSeededApartmentDetails } from '../utils/admin-apartments';
import { CURRENT_MONTH_YEAR } from '../utils/date-utils';

const CURRENT_YEAR = new Date().getFullYear();

test.describe('Admin apartment details', () => {
  test('admin can view apartment details', async ({ adminPage }) => {
    await openSeededApartmentDetails(adminPage);

    await expect(adminPage).toHaveURL(
      /\/admin\/apartments\/[a-f0-9-]+\/[a-f0-9-]+/
    );
  });

  test('apartment details shows monthly chart section inside payment history', async ({
    adminPage,
  }) => {
    await openSeededApartmentDetails(adminPage);

    await expect(
      adminPage.getByText(/Wykres rozliczeń miesięcznych/i).first()
    ).toBeVisible();
  });

  test('charges are grouped into year sections with the newest year open', async ({
    adminPage,
  }) => {
    await openSeededApartmentDetails(adminPage);

    await expect(
      adminPage.getByRole('button', { name: String(CURRENT_YEAR), exact: true })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: new RegExp(CURRENT_MONTH_YEAR) })
    ).toBeVisible();
  });
});
