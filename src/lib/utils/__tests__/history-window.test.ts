import { describe, expect, it } from 'vitest';

import {
  chargesFromYear,
  getHistoryStartYear,
  paymentsFromYear,
} from '@/lib/utils/history-window';

describe('history window', () => {
  it('keeps the current year and two previous full years', () => {
    expect(getHistoryStartYear(new Date(2027, 5, 15), 2)).toBe(2025);
  });

  it('keeps only the current year when yearsBack is 0', () => {
    expect(getHistoryStartYear(new Date(2027, 5, 15), 0)).toBe(2027);
  });

  it('counts whole calendar years on the first day of January', () => {
    expect(getHistoryStartYear(new Date(2027, 0, 1), 2)).toBe(2025);
  });

  it('starts the charge window in January of the start year', () => {
    expect(chargesFromYear(2025)).toEqual({ period: { gte: '202501' } });
  });

  it('starts the payment window at the start year', () => {
    expect(paymentsFromYear(2025)).toEqual({ year: { gte: 2025 } });
  });
});
