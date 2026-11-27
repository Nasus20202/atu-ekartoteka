import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  formatLongDay,
  formatMonth,
  monthWeeks,
} from '@/lib/shared/utils/calendar';

describe('calendar', () => {
  it('lays a month out in six weeks starting on Monday', () => {
    const weeks = monthWeeks('2026-11-27');

    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0]).toBe('2026-10-26');
    expect(weeks[0][6]).toBe('2026-11-01');
    expect(weeks[5][6]).toBe('2026-12-06');
  });

  it('starts a month that begins on Monday with its first day', () => {
    expect(monthWeeks('2026-06-15')[0][0]).toBe('2026-06-01');
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('keeps the day of a month, or takes its last one', () => {
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-01-31', -2)).toBe('2025-11-30');
  });

  it('names months and days in Polish', () => {
    expect(formatMonth('2026-11-27')).toBe('listopad 2026');
    expect(formatLongDay('2026-11-27')).toBe('27 listopada 2026');
  });
});
