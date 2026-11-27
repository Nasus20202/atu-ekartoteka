import { describe, expect, it } from 'vitest';

import {
  toLocalDateTimeInput,
  toLocalIsoDate,
} from '@/lib/shared/utils/local-date';

describe('toLocalIsoDate', () => {
  it('formats the local calendar date', () => {
    expect(toLocalIsoDate(new Date(2026, 10, 1, 0, 30))).toBe('2026-11-01');
    expect(toLocalIsoDate(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09');
  });
});

describe('toLocalDateTimeInput', () => {
  it('formats a date and time value in the local time zone', () => {
    expect(toLocalDateTimeInput(new Date(2026, 10, 1, 7, 5))).toBe(
      '2026-11-01T07:05'
    );
    expect(toLocalDateTimeInput(new Date(2026, 11, 31, 23, 59))).toBe(
      '2026-12-31T23:59'
    );
  });
});
