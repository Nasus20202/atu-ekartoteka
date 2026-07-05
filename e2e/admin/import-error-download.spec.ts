import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';

test.describe('Admin Import Error Download', () => {
  test('admin can download error reports after import with validation errors', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await expect(
      adminPage.getByRole('heading', { name: /Import danych/i })
    ).toBeVisible();

    // Build the list of files to upload for TEST03 (data with validation errors)
    const importDir = fileURLToPath(
      new URL('../test-data/import', import.meta.url)
    );
    const filePayloads = fs
      .readdirSync(path.join(importDir, 'TEST03'))
      .filter((name) => name.endsWith('.txt'))
      .map((name) => {
        const filePath = path.join(importDir, 'TEST03', name);
        return {
          name,
          mimeType: 'text/plain',
          buffer: fs.readFileSync(filePath),
          lastModified: Date.now(),
        };
      });

    // Remove webkitdirectory attribute so Playwright can upload files
    await adminPage.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      input?.removeAttribute('webkitdirectory');
      input?.removeAttribute('directory');
    });

    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles(
      filePayloads.map((f) => ({
        name: `TEST03/${f.name}`,
        mimeType: f.mimeType,
        buffer: f.buffer,
      }))
    );

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

    // Verify error message is displayed
    await expect(adminPage.getByText(/Wspólnoty z błędami/i)).toBeVisible({
      timeout: 15000,
    });

    // Verify both download buttons appear
    const combinedButton = adminPage.getByRole('button', {
      name: /Pobierz wszystkie błędy/i,
    });
    await expect(combinedButton).toBeVisible();

    // Check per-HOA download button exists
    const perHoaButton = adminPage.getByRole('button', {
      name: /Pobierz błędy/i,
    });
    await expect(perHoaButton).toBeVisible();

    // Click "Pobierz wszystkie błędy" and capture the download
    const [combinedDownload] = await Promise.all([
      adminPage.waitForEvent('download', { timeout: 10000 }),
      combinedButton.click(),
    ]);

    expect(combinedDownload).toBeDefined();
    const combinedPath = await combinedDownload.path();
    const combinedText = fs.readFileSync(combinedPath, 'utf-8');

    expect(combinedText).toContain('=== Wspólnota: TEST03 ===');
    expect(combinedText).toContain('BŁĄD');
    expect(combinedText).toContain('Łącznie: 1 wspólnota');

    // Click per-HOA "Pobierz błędy" and capture the download
    const [perHoaDownload] = await Promise.all([
      adminPage.waitForEvent('download', { timeout: 10000 }),
      perHoaButton.click(),
    ]);

    expect(perHoaDownload).toBeDefined();
    const perHoaPath = await perHoaDownload.path();
    const perHoaText = fs.readFileSync(perHoaPath, 'utf-8');

    expect(perHoaText).toContain('=== Wspólnota: TEST03 ===');
    expect(perHoaText).toContain('BŁĄD');
    expect(perHoaText).toContain('Łącznie: 1 wspólnota, 1 błąd');
  });
});
