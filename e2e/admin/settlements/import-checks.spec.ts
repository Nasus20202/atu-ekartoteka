/**
 * What the preview of a generated settlement PDF finds when it compares it with
 * the apartments and their charges.
 */

import type { Page } from '@playwright/test';

import type { FixturePage } from '@/__tests__/helpers/settlement-pdf/fixture-page';

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

const FILE = 'kontrola.pdf';
const OWNER = 'Importowa Alina';
const NO_SUCH_OWNER = /lokal nie ma takiego właściciela/;

test.describe('Admin settlement import checks', () => {
  let hoa: ImportHoa;

  test.beforeAll(async () => {
    hoa = await createImportHoa();
  });

  test.afterAll(async () => {
    await deleteImportHoa(hoa);
  });

  async function previewPrintout(page: Page, printout: FixturePage) {
    await page.goto('/admin/import');
    await previewSettlementFiles(page, [await pdfFile(FILE, printout)]);
    return fileSection(page, FILE);
  }

  test('blocks an owner the apartment never had, even without validation', async ({
    adminPage,
  }) => {
    const apartment = await addImportApartment(hoa, OWNER);
    await addCharges(apartment, utilityCharges());
    const printout = utilityPrintout(apartment, { owner: 'Nieznany Zbigniew' });

    const file = await previewPrintout(adminPage, printout);
    await expect(file.getByText(NO_SUCH_OWNER)).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();

    await switchOnImportOption(adminPage, /^Pomiń walidację rozliczeń/, [
      'Tak, pomiń walidację',
      'Potwierdzam – pomiń walidację',
    ]);
    await previewSettlementFiles(adminPage, [await pdfFile(FILE, printout)]);

    await expect(file.getByText(NO_SUCH_OWNER)).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();
  });

  test('stores a settlement of a former owner on their record', async ({
    adminPage,
  }) => {
    const former = await addImportApartment(hoa, 'Dawna Barbara', {
      isActive: false,
    });
    const current = await addImportApartment(hoa, 'Nowy Cezary', {
      sameApartmentAs: former,
    });
    await addCharges(former, utilityCharges());

    await previewPrintout(adminPage, utilityPrintout(former));
    await importPreviewed(adminPage);
    await expect(
      fileSection(adminPage, FILE).getByText(importStats(1))
    ).toBeVisible();

    const card = adminPage.getByRole('region', {
      name: 'Rozliczenia',
      exact: true,
    });
    await adminPage.goto(`/admin/apartments/${hoa.hoaId}/${former.id}`);
    await expect(card.getByLabel('Dane dokumentu')).toContainText(FILE);
    await adminPage.goto(`/admin/apartments/${hoa.hoaId}/${current.id}`);
    // The page of a record without settlements has no card for them
    await expect(
      adminPage.getByRole('heading', { level: 1, name: /Lokal/ })
    ).toBeVisible();
    await expect(card).toHaveCount(0);
  });

  test('rejects quantities that differ from the charges', async ({
    adminPage,
  }) => {
    const apartment = await addImportApartment(hoa, OWNER);
    await addCharges(apartment, utilityCharges(2.4));

    const file = await previewPrintout(adminPage, utilityPrintout(apartment));

    await expect(
      file.getByText(/ilość zaliczek w pliku 15, w naliczeniach 12\./)
    ).toBeVisible();
    await expect(importButton(adminPage)).toBeDisabled();
  });

  test('warns about missing charges and a meter that disagrees', async ({
    adminPage,
  }) => {
    const apartment = await addImportApartment(hoa, OWNER);
    // 9.3 on the meter, 10.3 billed
    const printout = utilityPrintout(apartment, {
      readings: ['105,500', '114,800', '9,300'],
    });

    const file = await previewPrintout(adminPage, printout);
    await expect(
      file.getByText(/nie zweryfikowano z naliczeniami, brak naliczeń za:/)
    ).toBeVisible();
    await expect(
      file.getByText(/rozliczone zużycie 10,3, zużycie według liczników 9,3\./)
    ).toBeVisible();
    await importPreviewed(adminPage);

    await expect(file.getByText(importStats(1))).toBeVisible();
  });
});
