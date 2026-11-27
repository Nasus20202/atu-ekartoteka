/**
 * The clean import and the import without validation of settlement PDFs.
 */

import type { Page } from '@playwright/test';

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

const FILE_NAME = 'opcje.pdf';
const PREVIEW_PATH = '/api/admin/import/settlements/preview';
const IMPORT_PATH = '/api/admin/import/settlements';
const IMPORT = 'Importuj rozliczenia';
const CLEAN_IMPORT = 'Importuj rozliczenia (z usunięciem danych)';

test.describe('Admin settlement import options', () => {
  // The tests share one HOA
  test.describe.configure({ mode: 'serial' });
  let hoa: SettlementTestHoa;

  test.beforeAll(async ({}, testInfo) => {
    hoa = await createSettlementTestHoa(
      `TESTOPT${testInfo.project.name.charAt(0).toUpperCase()}`
    );
  });

  test.afterAll(async () => {
    await deleteSettlementTestHoa(hoa);
  });

  const settlement = (overrides: FixtureUtilityPage = {}) =>
    renderFixturePdf([
      utilityPage({
        owner: SETTLEMENT_OWNER,
        apartmentId: hoa.externalApartmentId,
        ...overrides,
      }),
    ]);

  async function request(page: Page, path: string, run: () => Promise<void>) {
    await Promise.all([
      page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === path && response.status() === 200
      ),
      run(),
    ]);
  }

  const click = (page: Page, name: string) =>
    page.getByRole('button', { name, exact: true }).click();

  async function preview(page: Page, pdf: Buffer) {
    const input = page.locator(SETTLEMENT_INPUT_SELECTOR);
    await input.setInputFiles([]);
    await input.setInputFiles({
      name: FILE_NAME,
      mimeType: 'application/pdf',
      buffer: pdf,
    });
    await request(page, PREVIEW_PATH, () => click(page, 'Sprawdź pliki'));
  }

  async function switchOn(page: Page, option: RegExp, answers: string[]) {
    await page.getByRole('checkbox', { name: option }).click();
    for (const answer of answers) await click(page, answer);
    await expect(page.getByRole('checkbox', { name: option })).toBeChecked();
  }

  test('imports a file with a failed check only without validation', async ({
    adminPage,
  }) => {
    // The printed consumption is not the difference of the readings
    const faulty = await settlement({
      meters: [
        'CW 01 7000001 (CW 1) 30/04/2022 105,500 30/09/2022 115,800 11,000 m3',
      ],
    });
    await adminPage.goto('/admin/import');
    const file = adminPage.getByRole('region', { name: `Plik ${FILE_NAME}` });

    await preview(adminPage, faulty);
    await expect(
      adminPage.getByRole('button', { name: IMPORT, exact: true })
    ).toBeDisabled();

    await switchOn(adminPage, /^Pomiń walidację rozliczeń/, [
      'Tak, pomiń walidację',
      'Potwierdzam – pomiń walidację',
    ]);
    await expect(file).toBeHidden();
    await preview(adminPage, faulty);
    await expect(adminPage.getByText(/Walidacja pominięta/)).toBeVisible();
    await request(adminPage, IMPORT_PATH, () => click(adminPage, IMPORT));

    await expect(
      file.getByText('Utworzono: 1, zaktualizowano: 0, bez zmian: 0')
    ).toBeVisible();
  });

  test('replaces the stored period with a clean import', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');
    await switchOn(adminPage, /^Czysty import rozliczeń/, [
      'Rozumiem, dalej',
      'Potwierdzam – czysty import',
    ]);

    await preview(adminPage, await settlement());
    await expect(
      adminPage.getByText('Czysty import usunie zapisane rozliczenia: 1.')
    ).toBeVisible();
    await click(adminPage, CLEAN_IMPORT);
    await request(adminPage, IMPORT_PATH, () =>
      click(adminPage, 'Tak, usuń i importuj')
    );

    await expect(
      adminPage.getByText('Usunięto zapisanych rozliczeń: 1')
    ).toBeVisible();
    await expect(
      adminPage.getByText('Utworzono: 1, zaktualizowano: 0, bez zmian: 0')
    ).toBeVisible();
  });
});
