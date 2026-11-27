/**
 * Visual regression test for the admin import page.
 */

import type { DatabaseStatsDto } from '../../src/lib/admin/dto/database-stats-dto';
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

// Fixed statistics: the database changes every day, so the screenshot would too
const DATABASE_STATS: DatabaseStatsDto = {
  hoa: {
    count: 2,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: '2025-01-20T00:00:00.000Z',
  },
  apartments: {
    count: 12,
    active: 10,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: '2025-01-15T00:00:00.000Z',
  },
  users: {
    count: 14,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: '2025-01-15T00:00:00.000Z',
  },
  charges: {
    count: 40,
    rangeFrom: '2025-01-01T00:00:00.000Z',
    rangeTo: '2025-12-01T00:00:00.000Z',
    lastChangedAt: '2025-01-20T00:00:00.000Z',
  },
  notifications: {
    count: 3,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: '2025-01-20T00:00:00.000Z',
  },
  payments: {
    count: 5,
    rangeFrom: '2025-01-01T00:00:00.000Z',
    rangeTo: '2025-12-31T00:00:00.000Z',
    lastChangedAt: '2025-01-20T00:00:00.000Z',
  },
  utilitySettlements: {
    count: 0,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: null,
  },
  meterReadings: {
    count: 0,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: null,
  },
  annualSettlements: {
    count: 0,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: null,
  },
};

test.describe('Visual: admin import', () => {
  test('import page', async ({ visualAdminPage }) => {
    // Matches the summary request with or without the associations parameter
    await visualAdminPage.route(
      (url) => url.pathname === '/api/admin/stats',
      (route) => route.fulfill({ json: DATABASE_STATS })
    );
    await visualAdminPage.goto('/admin/import');
    // A text both the table and the phone cards show, so either layout waits
    await expect(
      visualAdminPage.getByText('Ostatnia zmiana').first()
    ).toBeVisible();
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
