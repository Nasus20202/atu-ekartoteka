/**
 * The apartments page shows the header and footer of every HOA in a modal.
 */

import { expect, test } from '../fixtures';
import { openHoaList, TEST_HOA } from '../utils/admin-apartments';
import { setHoaNotice } from '../utils/set-hoa-notice';

const HEADER = 'Nagłówek zawiadomienia – modal';
const FOOTER = 'Stopka zawiadomienia – modal';

test.describe('HOA notices dialog', () => {
  test.afterEach(async () => {
    await setHoaNotice(TEST_HOA, null, null);
  });

  test('admin sees header and footer of the HOA in the modal', async ({
    adminPage,
  }) => {
    await setHoaNotice(TEST_HOA, HEADER, FOOTER);
    await openHoaList(adminPage);

    await adminPage.getByRole('button', { name: 'Nagłówki i stopki' }).click();

    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(HEADER)).toBeVisible();
    await expect(dialog.getByText(FOOTER)).toBeVisible();
  });

  test('admin closes the modal with the close button', async ({
    adminPage,
  }) => {
    await openHoaList(adminPage);

    await adminPage.getByRole('button', { name: 'Nagłówki i stopki' }).click();
    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Zamknij', exact: true }).click();

    await expect(dialog).toBeHidden();
  });

  test('admin closes the modal with the cross', async ({ adminPage }) => {
    await openHoaList(adminPage);

    await adminPage.getByRole('button', { name: 'Nagłówki i stopki' }).click();
    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Zamknij okno' }).click();

    await expect(dialog).toBeHidden();
  });

  test('admin closes the modal by clicking outside it', async ({
    adminPage,
  }) => {
    await openHoaList(adminPage);

    await adminPage.getByRole('button', { name: 'Nagłówki i stopki' }).click();
    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await adminPage.mouse.click(5, 5);

    await expect(dialog).toBeHidden();
  });
});
