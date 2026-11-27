/**
 * The settlement section of the admin import page: choosing generated PDFs,
 * previewing them, which writes nothing, and importing them.
 */

import { expect, type Page } from '@playwright/test';

import type { FixturePage } from '../../src/__tests__/helpers/settlement-pdf/fixture-page';
import { renderFixturePdf } from '../../src/__tests__/helpers/settlement-pdf/render-fixture-pdf';
import { SETTLEMENT_INPUT_SELECTOR } from './file-input';

const PREVIEW_PATH = '/api/admin/import/settlements/preview';
const IMPORT_PATH = '/api/admin/import/settlements';
export const IMPORT_BUTTON = 'Importuj rozliczenia';

export interface PdfFile {
  name: string;
  pdf: Buffer;
}

export async function pdfFile(
  name: string,
  ...pages: FixturePage[]
): Promise<PdfFile> {
  return { name, pdf: await renderFixturePdf(pages) };
}

const answered = (page: Page, path: string) =>
  page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === path && response.status() === 200
  );

export async function previewSettlementFiles(
  page: Page,
  files: PdfFile[]
): Promise<void> {
  // Choosing no file first makes the same file count as a new choice
  const input = page.locator(SETTLEMENT_INPUT_SELECTOR);
  await input.setInputFiles([]);
  await input.setInputFiles(
    files.map(({ name, pdf }) => ({
      name,
      mimeType: 'application/pdf',
      buffer: pdf,
    }))
  );
  await Promise.all([
    answered(page, PREVIEW_PATH),
    page.getByRole('button', { name: 'Sprawdź pliki' }).click(),
  ]);
}

export function previewSettlementFile(
  page: Page,
  fileName: string,
  pdf: Buffer
): Promise<void> {
  return previewSettlementFiles(page, [{ name: fileName, pdf }]);
}

export const importButton = (page: Page) =>
  page.getByRole('button', { name: IMPORT_BUTTON, exact: true });

/** The preview of one file, or its outcome after the import. */
export const fileSection = (page: Page, fileName: string) =>
  page.getByRole('region', { name: `Plik ${fileName}` });

export async function importPreviewed(page: Page): Promise<void> {
  await Promise.all([answered(page, IMPORT_PATH), importButton(page).click()]);
}

export const importStats = (created: number, updated = 0, unchanged = 0) =>
  `Utworzono: ${created}, zaktualizowano: ${updated}, bez zmian: ${unchanged}`;

/** Switches an import option on, answering both of its questions. */
export async function switchOnImportOption(
  page: Page,
  option: RegExp,
  answers: string[]
): Promise<void> {
  await page.getByRole('checkbox', { name: option }).click();
  for (const answer of answers) {
    await page.getByRole('button', { name: answer, exact: true }).click();
  }
  await expect(page.getByRole('checkbox', { name: option })).toBeChecked();
}
