/**
 * Import of settlement PDFs on the admin import page, with generated sample
 * printouts.
 */

import type { Page } from '@playwright/test';

import { row } from '@/__tests__/helpers/settlement-pdf/fixture-page';
import { renderFixturePdf } from '@/__tests__/helpers/settlement-pdf/render-fixture-pdf';
import {
  type FixtureUtilityPage,
  utilityPage,
} from '@/__tests__/helpers/settlement-pdf/utility-page';

import { expect, test } from '../fixtures';
import { SETTLEMENT_INPUT_SELECTOR } from '../utils/file-input';
import {
  createSettlementTestHoa,
  deleteSettlementTestHoa,
  SETTLEMENT_OWNER,
  type SettlementTestHoa,
} from '../utils/settlement-test-hoa';

const FILE_NAME = 'rozliczenie.pdf';
const PREVIEW_PATH = '/api/admin/import/settlements/preview';
const IMPORT_PATH = '/api/admin/import/settlements';

test.describe('Admin settlement import', () => {
  let hoa: SettlementTestHoa;

  test.beforeAll(async ({}, testInfo) => {
    // One HOA per browser, as the projects share the database
    hoa = await createSettlementTestHoa(
      `TESTPDF${testInfo.project.name.charAt(0).toUpperCase()}`
    );
  });

  test.afterAll(async () => {
    await deleteSettlementTestHoa(hoa);
  });

  async function request(page: Page, button: string, path: string) {
    await Promise.all([
      page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === path && response.status() === 200
      ),
      page.getByRole('button', { name: button }).click(),
    ]);
  }

  async function preview(page: Page, pdf: Buffer) {
    // Choosing no file first makes the same file count as a new choice
    const input = page.locator(SETTLEMENT_INPUT_SELECTOR);
    await input.setInputFiles([]);
    await input.setInputFiles({
      name: FILE_NAME,
      mimeType: 'application/pdf',
      buffer: pdf,
    });
    await request(page, 'Sprawdź pliki', PREVIEW_PATH);
  }

  const settlement = (overrides: FixtureUtilityPage = {}) =>
    renderFixturePdf([
      utilityPage({
        owner: SETTLEMENT_OWNER,
        apartmentId: hoa.externalApartmentId,
        ...overrides,
      }),
    ]);

  test('previews, imports, repeats and replaces a settlement', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');
    const file = adminPage.getByRole('region', { name: `Plik ${FILE_NAME}` });
    const stats = (created: number, updated: number, unchanged: number) =>
      file.getByText(
        `Utworzono: ${created}, zaktualizowano: ${updated}, bez zmian: ${unchanged}`
      );

    await preview(adminPage, await settlement());
    await expect(file.getByText('Rozliczeń: 1 (Nowe: 1)')).toBeVisible();
    await file
      .getByRole('button', { name: `Pokaż rozliczenia z pliku ${FILE_NAME}` })
      .click();
    await expect(file.getByRole('cell', { name: 'Nowe' })).toBeVisible();
    await request(adminPage, 'Importuj rozliczenia', IMPORT_PATH);
    await expect(stats(1, 0, 0)).toBeVisible();

    // A reprint of the same settlement changes nothing
    await preview(adminPage, await settlement({ issued: '01/01/2023' }));
    await expect(file.getByText('Rozliczeń: 1 (Bez zmian: 1)')).toBeVisible();
    await request(adminPage, 'Importuj rozliczenia', IMPORT_PATH);
    await expect(stats(0, 0, 1)).toBeVisible();

    // An annotated name differs from the stored record and needs both ticks
    const changed = await settlement({ owner: `${SETTLEMENT_OWNER} D` });
    await preview(adminPage, changed);
    await request(adminPage, 'Importuj rozliczenia', IMPORT_PATH);
    await expect(
      file.getByText(/Nic z niego nie zostało zapisane/)
    ).toBeVisible();

    await preview(adminPage, changed);
    await file.getByRole('checkbox', { name: /z pliku to właściciel/ }).check();
    await file
      .getByRole('checkbox', { name: /Zastąp zapisane rozliczenie/ })
      .check();
    await request(adminPage, 'Importuj rozliczenia', IMPORT_PATH);
    await expect(stats(0, 1, 0)).toBeVisible();
  });

  test('rejects a document that is not a settlement', async ({ adminPage }) => {
    await adminPage.goto('/admin/import');

    await preview(
      adminPage,
      await renderFixturePdf([[row('Faktura VAT 1/2026')]])
    );

    const file = adminPage.getByRole('region', { name: `Plik ${FILE_NAME}` });
    await expect(file.getByText(/Nierozpoznany dokument:/)).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: 'Importuj rozliczenia' })
    ).toBeDisabled();
  });
});
