/**
 * Admin data import tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';

test.describe('Admin Data Import', () => {
  test('admin can import HOA data and see apartments', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await expect(
      adminPage.getByRole('heading', { name: /Import danych/i })
    ).toBeVisible();

    // Build the list of files to upload, preserving the subfolder path so the
    // import handler can extract the HOA id (TEST02) from the directory name.
    const importDir = fileURLToPath(
      new URL('../test-data/import', import.meta.url)
    );
    const filePayloads = fs
      .readdirSync(path.join(importDir, 'TEST02'))
      .filter((name) => name.endsWith('.txt'))
      .map((name) => {
        const filePath = path.join(importDir, 'TEST02', name);
        return {
          name,
          mimeType: 'text/plain',
          buffer: fs.readFileSync(filePath),
          // webkitRelativePath is carried via the name for directory uploads;
          // Playwright uses the `name` field as the virtual path when it
          // contains a slash — so we embed the HOA folder in the name.
          lastModified: Date.now(),
        };
      });

    // The file input has webkitdirectory set, which prevents Playwright from
    // uploading individual files. Remove the attribute before setting files.
    await adminPage.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      input?.removeAttribute('webkitdirectory');
      input?.removeAttribute('directory');
    });

    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles(
      filePayloads.map((f) => ({
        name: `TEST02/${f.name}`,
        mimeType: f.mimeType,
        buffer: f.buffer,
      }))
    );

    // Should show number of files selected
    await expect(adminPage.getByText(/Wybrano plików/i)).toBeVisible();

    // Click import and wait for the API response
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/import') && resp.status() === 200,
        { timeout: 30000 }
      ),
      adminPage.getByRole('button', { name: /^Importuj$/i }).click(),
    ]);

    // Should show the success banner
    await expect(
      adminPage.getByText(/Import zakończony pomyślnie/i)
    ).toBeVisible({ timeout: 15000 });

    // Navigate to apartments page and verify imported data
    await adminPage.goto('/admin/apartments');

    await expect(
      adminPage.getByRole('heading', { name: /Mieszkania|Wspólnoty/i })
    ).toBeVisible();

    const test02Card = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: 'TEST02' });

    await expect(test02Card).toBeVisible();
    await expect(test02Card.getByText('3')).toBeVisible();

    await test02Card
      .getByRole('button', { name: /Zobacz mieszkania/i })
      .click();

    await expect(adminPage.getByText('ul. Importowa 2/1A')).toBeVisible();
  });
});
