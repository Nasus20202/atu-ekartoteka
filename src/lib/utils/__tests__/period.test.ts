import { describe, expect, it } from 'vitest';

import {
  dateToPeriod,
  getPeriodsBetween,
  isPeriodAfterDate,
  monthIndexToPeriod,
} from '@/lib/utils/period';

describe('dateToPeriod', () => {
  it('converts a Date to YYYYMM format', () => {
    expect(dateToPeriod(new Date('2026-05-31'))).toBe('202605');
  });

  it('pads single-digit months', () => {
    expect(dateToPeriod(new Date('2026-01-15'))).toBe('202601');
  });

  it('handles December correctly', () => {
    expect(dateToPeriod(new Date('2025-12-01'))).toBe('202512');
  });
});

describe('isPeriodAfterDate', () => {
  it('returns true when period is after the date', () => {
    expect(isPeriodAfterDate('202606', '2026-05-31')).toBe(true);
  });

  it('returns false when period is before the date', () => {
    expect(isPeriodAfterDate('202604', '2026-05-31')).toBe(false);
  });

  it('returns false when period equals the date period', () => {
    expect(isPeriodAfterDate('202605', '2026-05-31')).toBe(false);
  });

  it('returns false when dateStr is null', () => {
    expect(isPeriodAfterDate('202606', null)).toBe(false);
  });
});

describe('monthIndexToPeriod', () => {
  it('converts a zero-based month index to YYYYMM', () => {
    expect(monthIndexToPeriod(2026, 0)).toBe('202601');
    expect(monthIndexToPeriod(2026, 11)).toBe('202612');
  });
});

describe('getPeriodsBetween', () => {
  it('lists every period inclusively across a year boundary', () => {
    expect(getPeriodsBetween('202511', '202602')).toEqual([
      '202511',
      '202512',
      '202601',
      '202602',
    ]);
  });

  it('returns a single period when start equals end', () => {
    expect(getPeriodsBetween('202605', '202605')).toEqual(['202605']);
  });

  it('returns nothing when start is after end', () => {
    expect(getPeriodsBetween('202606', '202605')).toEqual([]);
  });
});
