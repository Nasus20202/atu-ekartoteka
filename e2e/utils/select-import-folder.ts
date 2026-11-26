import type { Page } from '@playwright/test';
import * as fs from 'fs';

import { FILE_INPUT_SELECTOR } from './file-input';

const IMPORT_DIR = new URL('../test-data/import/', import.meta.url);
const HOA_FOLDER = /^TEST\d+$/;

/**
 * Select the sample files of one HOA folder in the import page, as if the
 * admin had picked the folder.
 */
export async function selectImportFolder(page: Page, hoaId: string) {
  if (!HOA_FOLDER.test(hoaId))
    throw new Error(`Unknown import folder ${hoaId}`);
  const folder = new URL(`${hoaId}/`, IMPORT_DIR);
  const files = fs
    .readdirSync(folder)
    .filter((name) => name.endsWith('.txt'))
    .map((name) => ({
      name: `${hoaId}/${name}`,
      mimeType: 'text/plain',
      buffer: fs.readFileSync(new URL(name, folder)),
    }));

  await page.locator(FILE_INPUT_SELECTOR).waitFor({ state: 'attached' });
  // webkitdirectory stops Playwright from setting individual files
  await page.evaluate((selector) => {
    const input = document.querySelector(selector);
    input?.removeAttribute('webkitdirectory');
    input?.removeAttribute('directory');
  }, FILE_INPUT_SELECTOR);
  await page.locator(FILE_INPUT_SELECTOR).setInputFiles(files);
}
