import { describe, expect, it } from 'vitest';

import { serialiseSettlementFindings } from '@/lib/settlements/rules/export-findings';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';

const issue = (overrides: Partial<SettlementIssue> = {}): SettlementIssue => ({
  kind: 'rounding',
  severity: 'warning',
  fileName: 'a.pdf',
  message: 'Komunikat',
  ...overrides,
});

describe('serialiseSettlementFindings', () => {
  it('lists each finding with its file, page and apartment', () => {
    const text = serialiseSettlementFindings([
      {
        fileName: 'a.pdf',
        errors: [
          issue({
            severity: 'error',
            page: 2,
            apartmentExternalId: 'TST01-1',
          }),
        ],
        warnings: [issue()],
      },
      { fileName: 'clean.pdf', errors: [], warnings: [] },
    ]);

    expect(text).toBe(
      [
        '=== Plik: a.pdf ===',
        'BŁĄD|str. 2|TST01-1|Komunikat',
        'OSTRZEŻENIE|||Komunikat',
        '',
        '---',
        'Łącznie: 1 błąd, 1 ostrzeżenie',
      ].join('\n')
    );
  });

  it('is empty without findings', () => {
    expect(
      serialiseSettlementFindings([
        { fileName: 'a.pdf', errors: [], warnings: [] },
      ])
    ).toBe('');
  });
});
