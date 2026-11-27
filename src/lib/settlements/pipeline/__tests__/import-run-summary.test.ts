import { describe, expect, it } from 'vitest';

import type {
  SettlementImportFileDto,
  SettlementPreviewFileDto,
} from '@/lib/settlements/dto/settlement-import-dto';
import {
  settlementImportSummary,
  settlementPreviewSummary,
} from '@/lib/settlements/pipeline/import-run-summary';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';

const issue = (
  kind: SettlementIssue['kind'],
  severity: SettlementIssue['severity']
): SettlementIssue => ({
  kind,
  severity,
  fileName: 'rozliczenie.pdf',
  message: 'x',
});

const stats = { created: 1, updated: 0, unchanged: 2 };

function importedFile(
  overrides: Partial<SettlementImportFileDto> = {}
): SettlementImportFileDto {
  return {
    fileName: 'rozliczenie.pdf',
    imported: true,
    stats,
    errors: [],
    warnings: [],
    ...overrides,
  };
}

function previewFile(
  overrides: Partial<SettlementPreviewFileDto> = {}
): SettlementPreviewFileDto {
  return {
    fileName: 'rozliczenie.pdf',
    documentType: 'utility',
    errors: [],
    warnings: [],
    records: [],
    ...overrides,
  };
}

describe('settlementPreviewSummary', () => {
  it('is a success when no file has errors', () => {
    const summary = settlementPreviewSummary({
      removals: 0,
      files: [previewFile({ warnings: [issue('rounding', 'warning')] })],
    });

    expect(summary.result).toBe('success');
    expect(summary.records).toEqual([]);
    expect(summary.findings).toEqual([
      { severity: 'warning', kind: 'rounding' },
    ]);
  });

  it('is a partial run when some files have errors', () => {
    const summary = settlementPreviewSummary({
      removals: 0,
      files: [
        previewFile(),
        previewFile({ errors: [issue('unknown-document', 'error')] }),
      ],
    });

    expect(summary.result).toBe('partial');
    expect(summary.findings).toEqual([
      { severity: 'error', kind: 'unknown-document' },
    ]);
  });

  it('is a failure when every file has errors', () => {
    const summary = settlementPreviewSummary({
      removals: 0,
      files: [previewFile({ errors: [issue('match', 'error')] })],
    });

    expect(summary.result).toBe('failure');
  });
});

describe('settlementImportSummary', () => {
  it('counts the stored records of each imported file by its document type', () => {
    const summary = settlementImportSummary({
      response: { removed: 0, success: true, files: [importedFile()] },
      writes: [{ documentType: 'annual', stats }],
    });

    expect(summary.result).toBe('success');
    expect(summary.records).toEqual([
      { entity: 'annual_settlement', action: 'created', count: 1 },
      { entity: 'annual_settlement', action: 'updated', count: 0 },
      { entity: 'annual_settlement', action: 'unchanged', count: 2 },
    ]);
  });

  it('is a partial run when some files were imported', () => {
    const summary = settlementImportSummary({
      response: {
        removed: 0,
        success: false,
        files: [
          importedFile(),
          importedFile({
            imported: false,
            errors: [issue('confirmation', 'error')],
          }),
        ],
      },
      writes: [{ documentType: 'utility', stats }],
    });

    expect(summary.result).toBe('partial');
    expect(summary.findings).toEqual([
      { severity: 'error', kind: 'confirmation' },
    ]);
  });

  it('is a failure when no file was imported', () => {
    const summary = settlementImportSummary({
      response: {
        removed: 0,
        success: false,
        files: [
          importedFile({
            imported: false,
            errors: [issue('database', 'error')],
          }),
        ],
      },
      writes: [],
    });

    expect(summary.result).toBe('failure');
    expect(summary.records).toEqual([]);
    expect(summary.findings).toEqual([{ severity: 'error', kind: 'database' }]);
  });
});
