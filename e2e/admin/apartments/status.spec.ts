/** Deactivating and activating an apartment from its page. */

import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import {
  addImportApartment,
  createImportHoa,
  deleteImportHoa,
  type ImportApartment,
  type ImportHoa,
} from '../../utils/settlement-import-hoa';

const DEACTIVATE = 'Dezaktywuj';
const ACTIVATE = 'Aktywuj';

test.describe('Apartment status', () => {
  let hoa: ImportHoa;
  let apartment: ImportApartment;

  test.beforeEach(async () => {
    hoa = await createImportHoa();
    apartment = await addImportApartment(hoa, 'Status Testowy');
  });

  test.afterEach(async () => {
    await deleteImportHoa(hoa);
  });

  const status = (page: Page, label: 'Aktywny' | 'Nieaktywny') =>
    page.getByText(label, { exact: true });

  const button = (page: Page, name: string) =>
    page.getByRole('button', { name, exact: true });

  async function answer(page: Page, action: string, reply: string) {
    await button(page, action).click();
    const dialog = page.getByRole('dialog', { name: `${action} mieszkanie` });
    await dialog.getByRole('button', { name: reply, exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  const activeList = () =>
    `/admin/apartments/${hoa.hoaId}?activeOnly=true&search=${apartment.number}`;

  test('is changed only after confirming, and stays changed', async ({
    adminPage,
  }) => {
    const details = `/admin/apartments/${hoa.hoaId}/${apartment.id}`;
    await adminPage.goto(details);

    await answer(adminPage, DEACTIVATE, 'Anuluj');
    await expect(status(adminPage, 'Aktywny')).toBeVisible();

    await answer(adminPage, DEACTIVATE, DEACTIVATE);
    await expect(status(adminPage, 'Nieaktywny')).toBeVisible();
    // Not reload(): goto() waits for the streamed content
    await adminPage.goto(details);
    await expect(status(adminPage, 'Nieaktywny')).toBeVisible();

    await adminPage.goto(activeList());
    await expect(adminPage.getByText('Znaleziono 0 mieszkań')).toBeVisible();

    await adminPage.goto(details);
    await answer(adminPage, ACTIVATE, ACTIVATE);
    await expect(status(adminPage, 'Aktywny')).toBeVisible();

    await adminPage.goto(activeList());
    await expect(adminPage.getByText('Znaleziono 1 mieszkanie')).toBeVisible();
  });
});
