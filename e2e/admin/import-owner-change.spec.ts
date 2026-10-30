import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';

test.describe('Admin Import Owner Change', () => {
  test('import with a former-owner wplaty row passes cross-file validation', async ({
    adminPage,
  }) => {
    // TEST05 wplaty has a former-owner balance-transfer row without charges
    // next to the current owner's row; nal_czynsz lists only the current owner.
    const importDir = fileURLToPath(
      new URL('../test-data/import/TEST05', import.meta.url)
    );
    const filePayloads = fs.readdirSync(importDir).map((name) => ({
      name: `TEST05/${name}`,
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

    await expect(
      adminPage.getByText(/Import zakończony pomyślnie/i)
    ).toBeVisible({ timeout: 15000 });
    await expect(adminPage.getByText(/Wspólnoty z błędami/i)).toHaveCount(0);
    await expect(adminPage.getByText(/naliczenia z wpłat/i)).toHaveCount(0);

    // The former owner and the lease are not imported, so their rows are
    // reported as skipped
    await expect(adminPage.getByText(/Ostrzeżenia \(2\)/i)).toBeVisible();
    await expect(
      adminPage.getByText(
        'Pominięto 1 wpłatę dla W20001: brak właściciela w lok.txt i w bazie',
        { exact: false }
      )
    ).toBeVisible();
    await expect(
      adminPage.getByText(
        /Lokal TEST05-00000-00000-STELES: Pominięto 1 naliczenie, 1 wpłatę dla N20003: identyfikator nie oznacza właściciela/
      )
    ).toBeVisible();
  });
});
