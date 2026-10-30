import { describe, expect, it } from 'vitest';

import {
  getHistoryStartPeriod,
  getHistoryStartYear,
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

  it('starts the period window in January of the start year', () => {
    expect(getHistoryStartPeriod(2025)).toBe('202501');
  });
});
