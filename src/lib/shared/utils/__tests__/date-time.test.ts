import { describe, expect, it } from 'vitest';

import { joinDateTime, splitDateTime } from '@/lib/shared/utils/date-time';

describe('date and time value', () => {
  it('splits a value into its parts', () => {
    expect(splitDateTime('2026-12-31T08:05')).toEqual({
      day: '2026-12-31',
      hours: 8,
      minutes: 5,
      time: '08:05',
    });
  });

  it.each(['', '2026-12-31', 'soon'])('has no parts in „%s”', (value) => {
    expect(splitDateTime(value)).toBeNull();
  });

  it('joins a day with a time, by default its end', () => {
    expect(joinDateTime('2026-12-31', 8, 5)).toBe('2026-12-31T08:05');
    expect(joinDateTime('2026-12-31')).toBe('2026-12-31T23:59');
  });
});
