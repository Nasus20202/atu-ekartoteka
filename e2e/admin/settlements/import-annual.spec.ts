/** Generated annual cost settlement PDFs on the admin import page. */

import type { Page } from '@playwright/test';

import {
  annualHeader,
  annualItem,
} from '@/__tests__/helpers/settlement-pdf/annual-page';
import {
  type FixturePage,
  row,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';

import { expect, test } from '../../fixtures';
import {
  addCharges,
  addImportApartment,
  createImportHoa,
  deleteImportHoa,
  type ImportApartment,
  type ImportHoa,
} from '../../utils/settlement-import-hoa';
import {
  fileSection,
  importButton,
  importPreviewed,
  importStats,
  pdfFile,
  previewSettlementFiles,
} from '../../utils/settlement-preview';
import {
  annualCharges,
  annualPeriod,
  annualPrintout,
  hotWaterItem,
  printedAddress,
  PRINTOUT_YEAR,
} from '../../utils/settlement-printouts';

const FILE = 'koszty.pdf';
const NOT_VERIFIED = /brak naliczeń rozliczeniowych wspólnoty/;

test.describe('Admin annual settlement import', () => {
  let hoa: ImportHoa;
  let apartment: ImportApartment;

  // The charges of one apartment count for its whole association
  test.beforeEach(async () => {
    hoa = await createImportHoa();
    apartment = await addImportApartment(hoa, 'Importowa Alina');
  });

  test.afterEach(async () => {
    await deleteImportHoa(hoa);
  });

  async function previewPrintout(page: Page, ...pages: FixturePage[]) {
    await page.goto('/admin/import');
    await previewSettlementFiles(page, [await pdfFile(FILE, ...pages)]);
    return fileSection(page, FILE);
  }

  test('recognises it without a title and imports it unverified', async ({
    adminPage,
  }) => {
    const file = await previewPrintout(adminPage, annualPrintout(apartment));

    await expect(file.getByText('Koszty rzeczywiste')).toBeVisible();
    await expect(file.getByText(NOT_VERIFIED)).toBeVisible();
    await importPreviewed(adminPage);

    await expect(file.getByText(importStats(1))).toBeVisible();
  });

  test('rejects a flat basis that differs from the charges', async ({
    adminPage,
  }) => {
    await addCharges(apartment, annualCharges(900));

    const file = await previewPrintout(adminPage, annualPrintout(apartment));

    await expect(
      file.getByText(/podstawa lokalu w pliku .+, w naliczeniach 900,00\szł\./)
    ).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();
  });

  test('only warns when the totals of the association differ', async ({
    adminPage,
  }) => {
    await addCharges(apartment, annualCharges());

    const file = await previewPrintout(adminPage, annualPrintout(apartment));

    await expect(
      file.getByText(/podstawa i kwota wspólnoty razem/)
    ).toBeVisible();
    await expect(file.getByText(NOT_VERIFIED)).toBeHidden();
    await expect(file.getByText(/podstawa lokalu w pliku/)).toBeHidden();
    await expect(importButton(adminPage)).toBeEnabled();
  });

  test('joins the items that continue on the next page', async ({
    adminPage,
  }) => {
    const elevator = annualItem({
      period: annualPeriod,
      title: `ROZLICZENIE KOSZTÓW ZA ROK ${PRINTOUT_YEAR} - DŹWIG`,
      basis: 'Utrzymanie dźwigu',
      communityAmount: '120,00',
      flatBasis: '120,00',
      coefficient: '0,0500',
      communityBasis: '2400,00',
      result: 'Niedopłata [naliczenie]: 6,00 zł.',
    });

    const file = await previewPrintout(
      adminPage,
      [
        ...annualHeader({ owner: apartment.owner }),
        row(`Lokal: ${printedAddress(apartment)}`),
        ...hotWaterItem(),
      ],
      [
        ...elevator,
        row('Nadpłata [lokal]: 26,00 zł.'),
        row('Nadpłata [Klient]: 26,00 zł.'),
      ]
    );

    await expect(file.getByText('Rozliczeń: 1 (Nowe: 1)')).toBeVisible();
    await file
      .getByRole('button', { name: `Pokaż rozliczenia z pliku ${FILE}` })
      .click();
    await expect(file.getByRole('cell', { name: /-26,00/ })).toBeVisible();
    await importPreviewed(adminPage);

    await expect(file.getByText(importStats(1))).toBeVisible();
  });
});
