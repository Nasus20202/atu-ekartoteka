/**
 * Generated settlement PDFs whose content cannot be accepted, and the file that
 * lists the findings.
 */

import { readFile } from 'node:fs/promises';

import { row } from '@/__tests__/helpers/settlement-pdf/fixture-page';

import { expect, test } from '../../fixtures';
import {
  addImportApartment,
  createImportHoa,
  deleteImportHoa,
  type ImportHoa,
} from '../../utils/settlement-import-hoa';
import {
  fileSection,
  importButton,
  pdfFile,
  previewSettlementFiles,
} from '../../utils/settlement-preview';
import { utilityPrintout } from '../../utils/settlement-printouts';

const FILE = 'tresc.pdf';
// The row below the apartment, inside the record
const INSIDE_RECORD = 5;

test.describe('Admin settlement import content', () => {
  let hoa: ImportHoa;

  test.beforeAll(async () => {
    hoa = await createImportHoa();
  });

  test.afterAll(async () => {
    await deleteImportHoa(hoa);
  });

  test('names an unrecognised row and downloads the findings', async ({
    adminPage,
  }) => {
    const apartment = await addImportApartment(hoa, 'Importowa Alina');
    const printout = utilityPrintout(apartment).toSpliced(
      INSIDE_RECORD,
      0,
      row('Opłata dodatkowa 5,00')
    );

    await adminPage.goto('/admin/import');
    await previewSettlementFiles(adminPage, [await pdfFile(FILE, printout)]);

    await expect(
      fileSection(adminPage, FILE).getByText(
        'Strona 1, Nierozpoznany wiersz: „Opłata dodatkowa 5,00”'
      )
    ).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();

    const downloading = adminPage.waitForEvent('download');
    await adminPage
      .getByRole('button', { name: 'Pobierz błędy i ostrzeżenia' })
      .click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('uwagi-import-rozliczen.txt');
    const findings = await readFile(await download.path(), 'utf8');
    expect(findings).toContain(`=== Plik: ${FILE} ===`);
    expect(findings).toContain(
      'BŁĄD|str. 1||Nierozpoznany wiersz: „Opłata dodatkowa 5,00”'
    );
  });

  test('rejects a line printed twice', async ({ adminPage }) => {
    const apartment = await addImportApartment(hoa, 'Importowa Alina');
    const printout = utilityPrintout(apartment);
    const line = printout.findIndex(({ text }) => text.endsWith('480,00'));

    await adminPage.goto('/admin/import');
    await previewSettlementFiles(adminPage, [
      await pdfFile(FILE, printout.toSpliced(line, 0, printout[line])),
    ]);

    await expect(
      fileSection(adminPage, FILE).getByText(
        /pozycja „Zaliczka CW” występuje dwa razy\./
      )
    ).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();
  });
});
