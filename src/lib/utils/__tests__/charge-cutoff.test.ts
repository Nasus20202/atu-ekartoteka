import { describe, expect, it } from 'vitest';

import {
  getChargeCutoffPeriod,
  isPeriodAfterCutoff,
} from '@/lib/utils/charge-cutoff';

const NOW = new Date(2026, 9, 31);

describe('getChargeCutoffPeriod', () => {
  it('returns null without payments or charges', () => {
    expect(getChargeCutoffPeriod([], NOW)).toBeNull();
    expect(getChargeCutoffPeriod([{ year: 2026 }], NOW)).toBeNull();
    expect(
      getChargeCutoffPeriod([{ year: 2026, mayCharges: 0 }], NOW)
    ).toBeNull();
  });

  it('returns the latest month with a non-zero charge', () => {
    expect(
      getChargeCutoffPeriod(
        [{ year: 2026, januaryCharges: '10', augustCharges: '5' }],
        NOW
      )
    ).toBe('202608');
  });

  it('takes the latest month across payment years and apartments', () => {
    expect(
      getChargeCutoffPeriod(
        [
          { year: 2025, decemberCharges: 1 },
          { year: 2026, julyCharges: 1 },
          { year: 2026, augustCharges: 1 },
        ],
        NOW
      )
    ).toBe('202608');
  });

  it('caps the cutoff at the current month', () => {
    expect(
      getChargeCutoffPeriod([{ year: 2026, decemberCharges: 1 }], NOW)
    ).toBe('202610');
  });
});

describe('isPeriodAfterCutoff', () => {
  it('compares periods against the cutoff', () => {
    expect(isPeriodAfterCutoff('202609', '202608')).toBe(true);
    expect(isPeriodAfterCutoff('202608', '202608')).toBe(false);
  });

  it('never hides anything without a cutoff', () => {
    expect(isPeriodAfterCutoff('209912', null)).toBe(false);
    expect(isPeriodAfterCutoff('209912', undefined)).toBe(false);
  });
});
