/**
 * Admin not-found pages for unknown associations and apartments
 */

import { expect, test } from '../fixtures';
import { cardWithText, openHoaList, TEST_HOA } from '../utils/admin-apartments';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Admin not-found pages', () => {
  test('unknown association shows the HOA 404', async ({ adminPage }) => {
    await adminPage.goto(`/admin/apartments/${MISSING_ID}`);

    await expect(
      adminPage.getByRole('heading', { name: 'Wspólnota nie znaleziona' })
    ).toBeVisible();
    await adminPage.getByRole('link', { name: 'Powrót do wspólnot' }).click();
    await expect(adminPage).toHaveURL(/\/admin\/apartments$/);
  });

  test('unknown apartment in a real association shows the apartment 404', async ({
    adminPage,
  }) => {
    await openHoaList(adminPage);
    // The seeded HOA exists for the whole run; the first card can be a
    // temporary HOA that another spec deletes while this test runs
    const hoaLink = cardWithText(adminPage, TEST_HOA).getByRole('link');
    await expect(hoaLink).toHaveAttribute(
      'href',
      /^\/admin\/apartments\/[\w-]+$/
    );

    await adminPage.goto(`${await hoaLink.getAttribute('href')}/${MISSING_ID}`);

    await expect(
      adminPage.getByRole('heading', { name: 'Mieszkanie nie znalezione' })
    ).toBeVisible();
  });
});
