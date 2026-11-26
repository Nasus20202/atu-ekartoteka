/**
 * Visual regression test for the admin import page.
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import { selectImportFolder } from '../utils/select-import-folder';

const ENTITY_STATS = { created: 0, updated: 0, skipped: 0, deleted: 0 };
const IMPORT_RESPONSE = {
  success: true,
  errors: [],
  results: [
    {
      hoaId: 'TEST02',
      apartments: { ...ENTITY_STATS, created: 3, total: 3 },
      charges: { ...ENTITY_STATS, created: 12, skipped: 1, total: 13 },
      payments: { ...ENTITY_STATS, updated: 3, total: 3 },
      errors: [],
      warnings: [],
      apartmentsDataDate: '2025-01-15T00:00:00.000Z',
      chargesDataDate: '2025-01-20T00:00:00.000Z',
    },
  ],
};

test.describe('Visual: admin import', () => {
  test('import page', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/import');
    await expect(visualAdminPage.getByRole('table')).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('import.png', {
      fullPage: true,
    });
  });

  test('import summary', async ({ visualAdminPage }) => {
    // The response is fixed so the import does not change the shared visual
    // database that other screenshots read
    await visualAdminPage.route('**/api/admin/import', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill({ json: IMPORT_RESPONSE });
    });
    await visualAdminPage.goto('/admin/import');
    await selectImportFolder(visualAdminPage, 'TEST02');

    await visualAdminPage.getByRole('button', { name: /^Importuj$/ }).click();
    const summary = visualAdminPage.getByRole('region', {
      name: 'Wynik importu',
    });
    await expect(summary.getByText('Wspólnota: TEST02')).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);
    // A tall element screenshot scrolls, which would draw the sticky page
    // title over the top of the summary
    await visualAdminPage.addStyleTag({
      content: '.group\\/header { position: static !important; }',
    });

    await expect(summary).toHaveScreenshot('import-summary.png');
  });

  test('validation year balances', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/import');
    await visualAdminPage.getByRole('button', { name: 'Waliduj dane' }).click();
    const region = visualAdminPage.getByRole('region', {
      name: 'Salda lat według wspólnot',
    });
    await expect(region.getByRole('table')).toBeVisible();
    await expect(
      visualAdminPage.getByRole('button', { name: /Walidowanie/ })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(region).toHaveScreenshot('year-balances.png');
  });
});
