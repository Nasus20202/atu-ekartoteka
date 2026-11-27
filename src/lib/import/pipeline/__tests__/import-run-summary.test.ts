import { describe, expect, it } from 'vitest';

import { batch, hoa, stats } from '@/__tests__/helpers/import/batch-results';
import { dataImportSummary } from '@/lib/import/pipeline/import-run-summary';

describe('dataImportSummary', () => {
  it('is a success when the batch succeeded', () => {
    const summary = dataImportSummary(batch([hoa()]));

    expect(summary.result).toBe('success');
    expect(summary.findings).toEqual([]);
  });

  it('counts the stats of every entity that was stored', () => {
    const summary = dataImportSummary(batch([hoa()]));

    expect(summary.records).toContainEqual({
      entity: 'apartment',
      action: 'created',
      count: 2,
    });
    expect(summary.records).toContainEqual({
      entity: 'apartment',
      action: 'updated',
      count: 1,
    });
    expect(summary.records).toContainEqual({
      entity: 'notification',
      action: 'skipped',
      count: 1,
    });
    expect(summary.records).toHaveLength(4 * 4);
  });

  it('leaves out the stats of an HOA whose transaction was rolled back', () => {
    const summary = dataImportSummary(
      batch([
        hoa({
          errors: [{ kind: 'transaction', message: 'rolled back' }],
        }),
      ])
    );

    expect(summary.records).toEqual([]);
    expect(summary.findings).toEqual([
      { severity: 'error', kind: 'transaction' },
    ]);
  });

  it.each(['missing-files', 'duplicate-records', 'balance-mismatch'] as const)(
    'leaves out the stats of an HOA stopped before any write (%s)',
    (kind) => {
      const summary = dataImportSummary(
        batch([hoa({ errors: [{ kind, message: 'stopped' }] })])
      );

      expect(summary.records).toEqual([]);
      expect(summary.findings).toEqual([{ severity: 'error', kind }]);
    }
  );

  it('keeps the stats of an HOA with database errors that were stored', () => {
    const summary = dataImportSummary(
      batch([hoa({ errors: [{ kind: 'database', message: 'one row' }] })])
    );

    expect(summary.records.length).toBeGreaterThan(0);
    expect(summary.result).toBe('failure');
  });

  it('counts file grouping errors and each association error once', () => {
    const summary = dataImportSummary(
      batch(
        [
          hoa({
            hoaId: 'HOA1',
            apartments: stats(0),
            errors: [{ kind: 'database', message: 'copied to the batch' }],
            warnings: [
              {
                kind: 'skipped-records',
                apartmentExternalId: 'A1',
                message: 'skipped',
              },
            ],
          }),
        ],
        [
          { kind: 'file-error', file: 'bad.txt', message: 'unknown file' },
          {
            kind: 'database',
            message: 'copied to the batch',
            hoaId: 'HOA1',
          },
        ]
      )
    );

    expect(summary.findings).toEqual([
      { severity: 'error', kind: 'file-error' },
      { severity: 'error', kind: 'database' },
      { severity: 'warning', kind: 'skipped-records' },
    ]);
  });

  it('is a partial run when some associations have no errors', () => {
    const summary = dataImportSummary(
      batch([
        hoa(),
        hoa({ hoaId: 'HOA2', errors: [{ kind: 'transaction', message: 'x' }] }),
      ])
    );

    expect(summary.result).toBe('partial');
  });

  it('is a failure when every association has errors', () => {
    const summary = dataImportSummary(
      batch([hoa({ errors: [{ kind: 'transaction', message: 'x' }] })])
    );

    expect(summary.result).toBe('failure');
  });

  it('is a failure when only file errors remain', () => {
    const summary = dataImportSummary(
      batch([], [{ kind: 'file-error', file: 'x.txt', message: 'unknown' }])
    );

    expect(summary.result).toBe('failure');
  });
});
