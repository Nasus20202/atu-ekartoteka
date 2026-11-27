/** Several generated settlement PDFs imported at once. */

import { row } from '@/__tests__/helpers/settlement-pdf/fixture-page';

import { expect, test } from '../../fixtures';
import {
  addCharges,
  addImportApartment,
  createImportHoa,
  deleteImportHoa,
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

const OWNER = 'Importowa Alina';

test.describe('Admin settlement import of several files', () => {
  let hoa: ImportHoa;

  test.beforeAll(async () => {
    hoa = await createImportHoa();
  });

  test.afterAll(async () => {
    await deleteImportHoa(hoa);
  });

  async function readyApartment() {
    const apartment = await addImportApartment(hoa, OWNER);
    await addCharges(apartment, utilityCharges());
    return apartment;
  }

  const invoice = () => pdfFile('faktura.pdf', [row('Faktura VAT 1/2026')]);

  test('writes only the files without errors', async ({ adminPage }) => {
    const apartment = await readyApartment();
    await adminPage.goto('/admin/import');
    await previewSettlementFiles(adminPage, [
      await pdfFile('dobry.pdf', utilityPrintout(apartment)),
      await invoice(),
    ]);

    await importPreviewed(adminPage);

    await expect(
      fileSection(adminPage, 'dobry.pdf').getByText(importStats(1))
    ).toBeVisible();
    await expect(
      fileSection(adminPage, 'faktura.pdf').getByText(
        /Nic z niego nie zostało zapisane/
      )
    ).toBeVisible();
  });

  test('rejects a settlement in two files and overlapping periods', async ({
    adminPage,
  }) => {
    const apartment = await readyApartment();
    await adminPage.goto('/admin/import');
    await previewSettlementFiles(adminPage, [
      await pdfFile('maj.pdf', utilityPrintout(apartment)),
      await pdfFile('kopia.pdf', utilityPrintout(apartment)),
      await pdfFile(
        'sierpien.pdf',
        utilityPrintout(apartment, { period: ['01/08', '31/10'] })
      ),
    ]);

    await expect(
      fileSection(adminPage, 'maj.pdf').getByText(
        /to samo rozliczenie jest w pliku „kopia\.pdf”/
      )
    ).toBeVisible();
    await expect(
      fileSection(adminPage, 'kopia.pdf').getByText(
        /to samo rozliczenie jest w pliku „maj\.pdf”/
      )
    ).toBeVisible();
    await expect(
      fileSection(adminPage, 'sierpien.pdf').getByText(
        /okres nakłada się na rozliczenie .+ z pliku „maj\.pdf”/
      )
    ).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();
  });

  test('counts the confirmations that are still missing', async ({
    adminPage,
  }) => {
    const apartment = await readyApartment();
    await adminPage.goto('/admin/import');
    await previewSettlementFiles(adminPage, [
      await pdfFile(
        'dopisek.pdf',
        utilityPrintout(apartment, { owner: `${OWNER} D` })
      ),
    ]);
    const notice = adminPage.getByText('Niezaznaczone potwierdzenia: 1.');

    await expect(notice).toBeVisible();
    await expect(
      adminPage.getByText('Wymagane potwierdzenia: 0 z 1')
    ).toBeVisible();
    await adminPage
      .getByRole('checkbox', { name: /z pliku to właściciel/ })
      .check();

    await expect(
      adminPage.getByText('Wymagane potwierdzenia: 1 z 1')
    ).toBeVisible();
    await expect(notice).toBeHidden();
  });

  test('blocks a clean import while one file has an error', async ({
    adminPage,
  }) => {
    const apartment = await readyApartment();
    await adminPage.goto('/admin/import');
    await switchOnImportOption(adminPage, /^Czysty import rozliczeń/, [
      'Rozumiem, dalej',
      'Potwierdzam – czysty import',
    ]);
    await previewSettlementFiles(adminPage, [
      await pdfFile('dobry.pdf', utilityPrintout(apartment)),
      await invoice(),
    ]);

    await expect(
      adminPage.getByText('Czysty import wymaga, aby wszystkie pliki')
    ).toBeVisible();
    await expect(
      adminPage.getByRole('listitem').filter({ hasText: 'faktura.pdf – błędy' })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('button', {
        name: 'Importuj rozliczenia (z usunięciem danych)',
      })
    ).toBeDisabled();
  });
});
