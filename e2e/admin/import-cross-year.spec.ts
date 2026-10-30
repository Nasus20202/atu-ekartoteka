import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';
import { createCrossYearImportFixture } from '../utils/create-cross-year-import-fixture';

const PARTIAL_YEAR_2026_END = '2026-09-30';

// We import 2027 wplaty with openingBalance=-123,00, which does not match the
// seeded 2026 closingBalance=-444.25.
async function importTest04(adminPage: Page): Promise<void> {
  const importDir = fileURLToPath(
    new URL('../test-data/import/TEST04', import.meta.url)
  );
  const filePayloads = fs
    .readdirSync(importDir)
    .filter((name) => name.endsWith('.txt'))
    .map((name) => ({
      name: `TEST04/${name}`,
      mimeType: 'text/plain',
      buffer: fs.readFileSync(path.join(importDir, name)),
    }));

  await adminPage.goto('/admin/import');

  await adminPage.evaluate(() => {
    const input = document.querySelector('input[type="file"]');
    input?.removeAttribute('webkitdirectory');
    input?.removeAttribute('directory');
  });

  await adminPage.locator('input[type="file"]').setInputFiles(filePayloads);

  await Promise.all([
    adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/import') && resp.status() === 200,
      { timeout: 30000 }
    ),
    adminPage.getByRole('button', { name: /^Importuj$/i }).click(),
  ]);
}

test.describe('Admin Import Cross-Year Validation', () => {
  // Both cases reseed the same TEST04 apartment
  test.describe.configure({ mode: 'serial' });

  test('import with mismatched openingBalance fails cross-year check', async ({
    adminPage,
  }) => {
    // TEST04 is isolated from shared TEST01 admin fixtures and has a seeded
    // complete 2026 payment (closingBalance=-444.25).
    await createCrossYearImportFixture();

    await importTest04(adminPage);

    await expect(adminPage.getByText(/Wspólnoty z błędami/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      adminPage
        .getByText(/Błędy walidacji/i)
        .locator('..')
        .getByText(/saldo otwarcia -123.*saldo zamknięcia -444.25/i)
        .first()
    ).toBeVisible();
  });

  test('import skips cross-year check when the previous year is partial', async ({
    adminPage,
  }) => {
    // The seeded 2026 payment ends on 30.09, so its closing balance is not a
    // year-end balance and the mismatching 2027 opening balance is accepted.
    await createCrossYearImportFixture(PARTIAL_YEAR_2026_END);

    await importTest04(adminPage);

    await expect(
      adminPage.getByText(/Import zakończony pomyślnie/i)
    ).toBeVisible({ timeout: 15000 });
    await expect(adminPage.getByText(/Wspólnoty z błędami/i)).toHaveCount(0);
  });
});
