/**
 * Admin HOA page shows the notification header and footer of the HOA.
 */

import { expect, test } from '../fixtures';
import { openHoaApartments, TEST_HOA } from '../utils/admin-apartments';
import { setHoaNotice } from '../utils/set-hoa-notice';

const HEADER = 'Nagłówek zawiadomienia wspólnoty';
const FOOTER = 'Stopka zawiadomienia wspólnoty';

test.describe('HOA notification header and footer', () => {
  test.afterEach(async () => {
    await setHoaNotice(TEST_HOA, null, null);
  });

  test('HOA page shows the header and the footer once expanded', async ({
    adminPage,
  }) => {
    await setHoaNotice(TEST_HOA, HEADER, FOOTER);

    await openHoaApartments(adminPage);

    await expect(adminPage.getByText(HEADER)).toHaveCount(0);
    await expect(adminPage.getByText(FOOTER)).toHaveCount(0);

    await adminPage
      .getByRole('button', { name: /Nagłówek i stopka powiadomień/ })
      .click();

    await expect(adminPage.getByText(HEADER)).toBeVisible();
    await expect(adminPage.getByText(FOOTER)).toBeVisible();
  });

  test('HOA page shows no notice card without header and footer', async ({
    adminPage,
  }) => {
    await setHoaNotice(TEST_HOA, null, null);

    await openHoaApartments(adminPage);

    await expect(adminPage.getByText('Wyszukiwanie')).toBeVisible();
    await expect(
      adminPage.getByText('Nagłówek i stopka powiadomień')
    ).toHaveCount(0);
  });
});
