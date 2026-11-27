/**
 * The way of generated settlement PDFs from the admin import to the tenant, and
 * who may send them.
 */

import { expect, login, test } from '../../fixtures';
import {
  addCharges,
  addImportApartment,
  createImportHoa,
  deleteImportHoa,
  type ImportApartment,
  type ImportHoa,
} from '../../utils/settlement-import-hoa';
import {
  createImportTenant,
  deleteImportTenant,
  type ImportTenant,
} from '../../utils/settlement-import-tenant';
import {
  fileSection,
  importPreviewed,
  importStats,
  pdfFile,
  previewSettlementFiles,
} from '../../utils/settlement-preview';
import {
  annualPrintout,
  PRINTOUT_YEAR,
  utilityCharges,
  utilityPrintout,
} from '../../utils/settlement-printouts';
import { E2E_PASSWORD } from '../../utils/test-credentials';

const IMPORT_PATHS = [
  '/api/admin/import/settlements/preview',
  '/api/admin/import/settlements',
];

test.describe('Admin settlement import for a tenant', () => {
  let hoa: ImportHoa;
  let apartment: ImportApartment;
  let tenant: ImportTenant;

  test.beforeAll(async () => {
    hoa = await createImportHoa();
    apartment = await addImportApartment(hoa, 'Importowa Alina');
    await addCharges(apartment, utilityCharges());
    tenant = await createImportTenant(hoa, apartment);
  });

  test.afterAll(async () => {
    await deleteImportTenant(tenant);
    await deleteImportHoa(hoa);
  });

  test('shows imported files to the tenant and counts them', async ({
    adminPage,
    page,
  }) => {
    await adminPage.goto('/admin/import');
    await previewSettlementFiles(adminPage, [
      await pdfFile('media.pdf', utilityPrintout(apartment)),
      await pdfFile('koszty.pdf', annualPrintout(apartment)),
    ]);
    await importPreviewed(adminPage);
    for (const name of ['media.pdf', 'koszty.pdf']) {
      await expect(
        fileSection(adminPage, name).getByText(importStats(1))
      ).toBeVisible();
    }

    await adminPage.getByRole('button', { name: 'Według wspólnot' }).click();
    const counts = adminPage
      .getByRole('row')
      .filter({ hasText: hoa.externalId })
      .getByRole('cell');
    // The columns of utility and annual settlements
    await expect(counts.nth(5)).toHaveText('1');
    await expect(counts.nth(6)).toHaveText('1');

    await login(page, tenant.email, E2E_PASSWORD);
    await page.goto('/dashboard/settlements');
    const utilities = page.getByRole('region', {
      name: 'Wynik rozliczenia mediów',
    });
    await expect(utilities).toContainText('Nadpłata za media');
    await expect(utilities).toContainText('150,40 zł');
    await expect(
      page.getByRole('region', { name: 'Ciepła woda (CW)' })
    ).toContainText(
      `Licznik nr ${apartment.meterSerial}, odczyty: 105,500 → 115,800 m³`
    );

    await page.getByRole('tab', { name: 'Koszty rzeczywiste' }).click();
    const annual = page.getByRole('region', {
      name: 'Suma rozliczenia rocznego',
    });
    await expect(annual).toContainText(
      `Suma: nadpłata za ${PRINTOUT_YEAR} rok`
    );
    await expect(annual).toContainText('32,00 zł');
  });

  test('rejects an anonymous caller and a tenant', async ({
    page,
    request,
  }) => {
    const { pdf } = await pdfFile('media.pdf', utilityPrintout(apartment));
    const data = {
      files: [{ fileName: 'media.pdf', data: pdf.toString('base64') }],
    };

    for (const path of IMPORT_PATHS) {
      expect((await request.post(path, { data })).status()).toBe(401);
    }
    await login(page, tenant.email, E2E_PASSWORD);
    for (const path of IMPORT_PATHS) {
      expect((await page.request.post(path, { data })).status()).toBe(403);
    }
  });
});
