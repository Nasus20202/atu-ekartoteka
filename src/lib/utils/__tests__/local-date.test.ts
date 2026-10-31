import { describe, expect, it } from 'vitest';

import { toLocalIsoDate } from '@/lib/utils/local-date';

describe('toLocalIsoDate', () => {
  it('formats the local calendar date', () => {
    expect(toLocalIsoDate(new Date(2026, 10, 1, 0, 30))).toBe('2026-11-01');
    expect(toLocalIsoDate(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09');
  });
});
