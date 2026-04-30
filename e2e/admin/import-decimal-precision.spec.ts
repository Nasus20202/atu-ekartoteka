/**
 * E2E tests for import warnings and Decimal-preserved totals.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';

function buildImportFiles() {
  const importDir = fileURLToPath(
    new URL('../test-data/import/TEST02', import.meta.url)
  );

  return fs
    .readdirSync(importDir)
    .filter((name) => name.endsWith('.txt'))
    .map((name) => {
      const filePath = path.join(importDir, name);
      let content = fs.readFileSync(filePath);

      if (name === 'nal_czynsz.txt') {
        const updated = content
          .toString('latin1')
          .replace(
            'W10001#TEST02-TEST02-00000-00001M#01/01/2025#31/01/2025#202501#3#Fundusz remontowy#50,4#m2#2,50#126,00',
            'W10001#TEST02-TEST02-00000-00001M#01/01/2025#31/01/2025#202501#3#Fundusz remontowy#50,4#m2#2,5005#126,00'
          );
        content = Buffer.from(updated, 'latin1');
      }

      return {
        name: `TEST02/${name}`,
        mimeType: 'text/plain',
        buffer: content,
      };
    });
}

test.describe('Admin Import Decimal Precision', () => {
  test('admin sees warning and preserved file total for sub-grosz import drift', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await expect(
      adminPage.getByRole('heading', { name: /Import danych/i })
    ).toBeVisible();

    await adminPage.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      input?.removeAttribute('webkitdirectory');
      input?.removeAttribute('directory');
    });

    await adminPage
      .locator('input[type="file"]')
      .setInputFiles(buildImportFiles());

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
    await expect(adminPage.getByText(/Ostrzeżenia \(1\)/i)).toBeVisible();
    await expect(
      adminPage.getByText(/Lokal TEST02-TEST02-00000-00001M, okres 202501/i)
    ).toBeVisible();
    await expect(adminPage.getByText(/różnica 0\.0252/i)).toBeVisible();

    await adminPage.goto('/admin/apartments');
    const hoaCard = adminPage.locator('.text-card-foreground').filter({
      hasText: 'TEST02',
    });
    await expect(hoaCard).toBeVisible();
    await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

    const apartmentCard = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: 'ul. Importowa 2/1A' });
    await apartmentCard
      .getByRole('button', { name: /Zobacz szczegóły/i })
      .click();

    await expect(adminPage.getByText(/Naliczenia/i).first()).toBeVisible();
    await adminPage
      .getByText(/Styczeń 2025/i)
      .first()
      .click();

    await expect(
      adminPage.getByText(/Fundusz remontowy/i).first()
    ).toBeVisible();
    await expect(adminPage.getByText('2,50 zł').first()).toBeVisible();
    await expect(adminPage.getByText('126,00 zł').first()).toBeVisible();
  });
});
