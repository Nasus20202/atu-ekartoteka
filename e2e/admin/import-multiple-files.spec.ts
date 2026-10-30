import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';

const IMPORT_DIR = fileURLToPath(
  new URL('../test-data/import/TEST05', import.meta.url)
);

interface ImportFile {
  name: string;
  content: string;
}

// Reuses the TEST05 rows under its own HOA so it never races the TEST05 spec
const HOA_ID = 'TEST06';

function readTest05(name: string): string {
  return fs
    .readFileSync(path.join(IMPORT_DIR, name), 'latin1')
    .replaceAll('TEST05', HOA_ID);
}

function wplatyLines(): string[] {
  return readTest05('wplaty.txt')
    .split('\n')
    .filter((line) => line.trim());
}

async function importFiles(adminPage: Page, files: ImportFile[]) {
  await adminPage.goto('/admin/import');
  await adminPage.evaluate(() => {
    const input = document.querySelector('input[type="file"]');
    input?.removeAttribute('webkitdirectory');
    input?.removeAttribute('directory');
  });
  await adminPage.locator('input[type="file"]').setInputFiles(
    files.map(({ name, content }) => ({
      name: `${HOA_ID}/${name}`,
      mimeType: 'text/plain',
      buffer: Buffer.from(content, 'latin1'),
    }))
  );

  await Promise.all([
    adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/import') && resp.status() === 200,
      { timeout: 30000 }
    ),
    adminPage.getByRole('button', { name: /^Importuj$/i }).click(),
  ]);
}

test.describe('Admin Import Multiple Files', () => {
  test.describe.configure({ mode: 'serial' });

  test('suffixed files of one kind are merged', async ({ adminPage }) => {
    const [first, ...rest] = wplatyLines();

    await importFiles(adminPage, [
      { name: 'lok.txt', content: readTest05('lok.txt') },
      { name: 'nal_czynsztest.txt', content: readTest05('nal_czynsz.txt') },
      { name: 'wplaty1.txt', content: `${first}\n` },
      { name: 'wplaty_2026.txt', content: `${rest.join('\n')}\n` },
    ]);

    await expect(
      adminPage.getByText(/Import zakończony pomyślnie/i)
    ).toBeVisible({ timeout: 15000 });
    await expect(adminPage.getByText(/Wspólnoty z błędami/i)).toHaveCount(0);
  });

  test('a record repeated in two files stops the import', async ({
    adminPage,
  }) => {
    const lines = wplatyLines();

    await importFiles(adminPage, [
      { name: 'lok.txt', content: readTest05('lok.txt') },
      { name: 'wplaty1.txt', content: `${lines.join('\n')}\n` },
      { name: 'wplaty2.txt', content: `${lines[1]}\n` },
    ]);

    await expect(adminPage.getByText(/Wspólnoty z błędami/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      adminPage
        .getByText(
          /Zduplikowane rekordy w plikach wplaty1\.txt i wplaty2\.txt \(1\)/
        )
        .first()
    ).toBeVisible();
  });
});
