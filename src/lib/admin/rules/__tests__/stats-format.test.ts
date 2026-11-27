import { describe, expect, it } from 'vitest';

import {
  EMPTY_VALUE,
  formatCount,
  formatDayOrDash,
  formatMonthOrDash,
  formatRange,
} from '@/lib/admin/rules/stats-format';

describe('formatRange', () => {
  it('formats day ranges as DD.MM.YYYY, reading UTC midnight as the stored day', () => {
    expect(
      formatRange('2024-01-01T00:00:00.000Z', '2026-12-31T00:00:00.000Z', 'day')
    ).toBe('01.01.2024 – 31.12.2026');
  });

  it('formats month ranges as MM.YYYY', () => {
    expect(
      formatRange(
        '2025-01-01T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        'month'
      )
    ).toBe('01.2025 – 12.2026');
  });

  it('shows a dash when the range is unknown', () => {
    expect(formatRange(null, null, 'day')).toBe(EMPTY_VALUE);
  });
});

describe('formatMonthOrDash', () => {
  it('formats a month', () => {
    expect(formatMonthOrDash('2025-03-01T00:00:00.000Z')).toBe('03.2025');
  });

  it('shows a dash without a month', () => {
    expect(formatMonthOrDash(null)).toBe(EMPTY_VALUE);
  });
});

describe('formatDayOrDash', () => {
  it('formats a day from UTC midnight', () => {
    expect(formatDayOrDash('2025-01-15T00:00:00.000Z')).toBe('15.01.2025');
  });

  it('shows a dash without a date', () => {
    expect(formatDayOrDash(null)).toBe(EMPTY_VALUE);
  });
});

describe('formatCount', () => {
  it('leaves short numbers as they are, as Polish typography does', () => {
    expect(formatCount(1234)).toBe('1234');
  });

  it('groups longer numbers with a non-breaking space', () => {
    expect(formatCount(12345)).toBe('12\u00a0345');
    expect(formatCount(1234567)).toBe('1\u00a0234\u00a0567');
  });
});
