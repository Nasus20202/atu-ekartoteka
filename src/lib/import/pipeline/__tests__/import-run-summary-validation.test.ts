import { describe, expect, it } from 'vitest';

import { batch, hoa, stats } from '@/__tests__/helpers/import/batch-results';
import { databaseValidationSummary } from '@/lib/import/pipeline/import-run-summary';

describe('databaseValidationSummary', () => {
  it('reports findings and no records', () => {
    const summary = databaseValidationSummary(
      batch([
        hoa({
          apartments: stats(4),
          warnings: [
            {
              kind: 'opening-balance-file',
              apartmentExternalId: 'A1',
              year: 2025,
              message: 'differs',
            },
          ],
        }),
      ])
    );

    expect(summary.result).toBe('success');
    expect(summary.records).toEqual([]);
    expect(summary.findings).toEqual([
      { severity: 'warning', kind: 'opening-balance-file' },
    ]);
  });

  it('maps a validation with errors in some HOAs to partial', () => {
    const summary = databaseValidationSummary(
      batch([
        hoa({
          errors: [{ kind: 'balance-mismatch', message: 'x', year: 2025 }],
        }),
        hoa({ hoaId: 'HOA2' }),
      ])
    );

    expect(summary.result).toBe('partial');
    expect(summary.findings).toEqual([
      { severity: 'error', kind: 'balance-mismatch' },
    ]);
  });
});
