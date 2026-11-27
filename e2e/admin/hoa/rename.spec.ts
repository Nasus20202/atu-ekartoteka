/** Renaming an association from its card on the list. */

import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { cardWithText } from '../../utils/admin-apartments';
import {
  createImportHoa,
  deleteImportHoa,
  type ImportHoa,
} from '../../utils/settlement-import-hoa';

const LIST = '/admin/apartments';

test.describe('HOA rename', () => {
  let hoa: ImportHoa;

  test.beforeEach(async () => {
    hoa = await createImportHoa();
  });

  test.afterEach(async () => {
    await deleteImportHoa(hoa);
  });

  const editButton = (page: Page, name: string) =>
    page.getByRole('button', {
      name: `Zmień nazwę wspólnoty ${name}`,
      exact: true,
    });

  // The external id stays on the card, so it finds the card while it is edited
  const card = (page: Page) => cardWithText(page, hoa.externalId);

  test('saves a new name and keeps the external id', async ({ adminPage }) => {
    const renamed = `Osiedle ${hoa.externalId}`;
    await adminPage.goto(LIST);

    await editButton(adminPage, hoa.externalId).click();
    await card(adminPage).getByRole('textbox').fill(renamed);
    await card(adminPage).getByRole('button', { name: 'Zapisz' }).click();
    await expect(editButton(adminPage, renamed)).toBeVisible();

    // Not reload(): goto() waits for the streamed content
    await adminPage.goto(LIST);
    await expect(card(adminPage).getByText(renamed)).toBeVisible();
    await expect(
      card(adminPage).getByText(hoa.externalId, { exact: true })
    ).toBeVisible();

    await card(adminPage)
      .getByRole('link', { name: 'Zobacz mieszkania' })
      .click();
    await expect(
      adminPage.getByRole('heading', { name: new RegExp(renamed) })
    ).toBeVisible();
  });

  test('keeps the old name when editing is cancelled', async ({
    adminPage,
  }) => {
    await adminPage.goto(LIST);

    await editButton(adminPage, hoa.externalId).click();
    await card(adminPage).getByRole('textbox').fill('Porzucona nazwa');
    await card(adminPage).getByRole('button', { name: 'Anuluj' }).click();
    await expect(editButton(adminPage, hoa.externalId)).toBeVisible();

    await editButton(adminPage, hoa.externalId).click();
    await card(adminPage).getByRole('textbox').fill('Porzucona nazwa');
    await card(adminPage).getByRole('textbox').press('Escape');
    await expect(editButton(adminPage, hoa.externalId)).toBeVisible();

    await adminPage.goto(LIST);
    await expect(editButton(adminPage, hoa.externalId)).toBeVisible();
    await expect(adminPage.getByText('Porzucona nazwa')).toHaveCount(0);
  });
});
