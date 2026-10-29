/**
 * Admin apartment details tests
 */

import { expect, test } from '../fixtures';
import { openSeededApartmentDetails } from '../utils/admin-apartments';

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
});
