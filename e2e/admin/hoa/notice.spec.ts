/**
 * Notification header and footer of the HOA, on its page and in the HOA list modal.
 *
 * Both describes write the same HOA notice, so they live in one file: files run
 * in parallel, but tests in one file run in order.
 */

import { expect, test } from '../../fixtures';
import {
  openHoaApartments,
  openHoaList,
  TEST_HOA,
} from '../../utils/admin-apartments';
import { setHoaNotice } from '../../utils/set-hoa-notice';

const HEADER = 'Nagłówek zawiadomienia wspólnoty';
const FOOTER = 'Stopka zawiadomienia wspólnoty';
const MODAL_HEADER = 'Nagłówek zawiadomienia – modal';
const MODAL_FOOTER = 'Stopka zawiadomienia – modal';

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

    await expect(
      adminPage.getByText('Wyszukiwanie').filter({ visible: true })
    ).toBeVisible();
    await expect(
      adminPage.getByText('Nagłówek i stopka powiadomień')
    ).toHaveCount(0);
  });
});

test.describe('HOA notices dialog', () => {
  test.afterEach(async () => {
    await setHoaNotice(TEST_HOA, null, null);
  });

  test('shows the header and footer of the HOA, and closes', async ({
    adminPage,
  }) => {
    await setHoaNotice(TEST_HOA, MODAL_HEADER, MODAL_FOOTER);
    await openHoaList(adminPage);

    await adminPage.getByRole('button', { name: 'Nagłówki i stopki' }).click();

    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(MODAL_HEADER)).toBeVisible();
    await expect(dialog.getByText(MODAL_FOOTER)).toBeVisible();

    await dialog.getByRole('button', { name: 'Zamknij', exact: true }).click();

    await expect(dialog).toBeHidden();
  });
});
