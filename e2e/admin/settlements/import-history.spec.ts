/** Generated settlement PDFs compared with settlements that are already stored. */

import type { Page } from '@playwright/test';

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
  switchOnImportOption,
} from '../../utils/settlement-preview';
import {
  utilityCharges,
  utilityPrintout,
} from '../../utils/settlement-printouts';

test.describe('Admin settlement import over stored settlements', () => {
  let hoa: ImportHoa;
  let apartment: ImportApartment;

  // A clean import removes a period of the whole association, so none is shared
  test.beforeEach(async () => {
    hoa = await createImportHoa();
    apartment = await addImportApartment(hoa, 'Importowa Alina');
    await addCharges(apartment, utilityCharges());
  });

  test.afterEach(async () => {
    await deleteImportHoa(hoa);
  });

  const summer = () => pdfFile('lato.pdf', utilityPrintout(apartment));

  /** The following period, starting with another reading than summer ended on. */
  const autumn = () =>
    pdfFile(
      'jesien.pdf',
      utilityPrintout(apartment, {
        period: ['01/10', '30/11'],
        readFrom: '30/09',
        readings: ['116,000', '126,300', '10,300'],
      })
    );

  async function importSummer(page: Page) {
    await page.goto('/admin/import');
    await previewSettlementFiles(page, [await summer()]);
    await importPreviewed(page);
    await expect(
      fileSection(page, 'lato.pdf').getByText(importStats(1))
    ).toBeVisible();
  }

  test('rejects an overlap and warns about a broken meter history', async ({
    adminPage,
  }) => {
    await importSummer(adminPage);

    await previewSettlementFiles(adminPage, [
      await pdfFile(
        'sierpien.pdf',
        utilityPrintout(apartment, { period: ['01/08', '31/10'] })
      ),
    ]);
    await expect(
      fileSection(adminPage, 'sierpien.pdf').getByText(
        /okres nakłada się na zapisane rozliczenie/
      )
    ).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();

    await previewSettlementFiles(adminPage, [await autumn()]);
    await expect(
      fileSection(adminPage, 'jesien.pdf').getByText(
        /odczyt z .+ w pliku 116, w zapisanym rozliczeniu 115,8\./
      )
    ).toBeVisible();
    await expect(importButton(adminPage)).toBeEnabled();
  });

  test('keeps the other periods in a clean import', async ({ adminPage }) => {
    await importSummer(adminPage);
    await previewSettlementFiles(adminPage, [await autumn()]);
    await importPreviewed(adminPage);

    await switchOnImportOption(adminPage, /^Czysty import rozliczeń/, [
      'Rozumiem, dalej',
      'Potwierdzam – czysty import',
    ]);
    await previewSettlementFiles(adminPage, [await summer()]);
    await expect(
      adminPage.getByText('Czysty import usunie zapisane rozliczenia: 1.')
    ).toBeVisible();
    await adminPage
      .getByRole('button', {
        name: 'Importuj rozliczenia (z usunięciem danych)',
      })
      .click();
    await adminPage
      .getByRole('button', { name: 'Tak, usuń i importuj' })
      .click();
    await expect(
      adminPage.getByText('Usunięto zapisanych rozliczeń: 1')
    ).toBeVisible();

    await adminPage.goto(`/admin/apartments/${hoa.hoaId}/${apartment.id}`);
    await adminPage.getByRole('button', { name: 'Okres' }).click();
    await expect(adminPage.getByRole('menuitemradio')).toHaveCount(2);
  });
});
