/**
 * Uploads one settlement PDF on the admin import page and waits for the preview
 * that checks it. A preview writes nothing.
 */

import type { Page } from '@playwright/test';

import { SETTLEMENT_INPUT_SELECTOR } from './file-input';

const PREVIEW_PATH = '/api/admin/import/settlements/preview';

export async function previewSettlementFile(
  page: Page,
  fileName: string,
  pdf: Buffer
): Promise<void> {
  // Choosing no file first makes the same file count as a new choice
  const input = page.locator(SETTLEMENT_INPUT_SELECTOR);
  await input.setInputFiles([]);
  await input.setInputFiles({
    name: fileName,
    mimeType: 'application/pdf',
    buffer: pdf,
  });
  await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === PREVIEW_PATH &&
        response.status() === 200
    ),
    page.getByRole('button', { name: 'Sprawdź pliki' }).click(),
  ]);
}
