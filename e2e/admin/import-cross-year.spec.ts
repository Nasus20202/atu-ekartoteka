import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';
import { createCrossYearImportFixture } from '../utils/create-cross-year-import-fixture';

test.describe('Admin Import Cross-Year Validation', () => {
  test('import with mismatched openingBalance fails cross-year check', async ({
    adminPage,
  }) => {
    // TEST04 is isolated from shared TEST01 admin fixtures and has a seeded
    // 2026 payment (closingBalance=-444.25).
    await createCrossYearImportFixture();

    // We import 2027 wplaty with openingBalance=-123,00, which should not
    // match the seeded 2026 closingBalance=-444.25.
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
});
