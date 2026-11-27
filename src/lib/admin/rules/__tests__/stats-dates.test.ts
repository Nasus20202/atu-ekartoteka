import { describe, expect, it } from 'vitest';

import { isoOrNull, periodToIsoMonth } from '@/lib/admin/rules/stats-dates';

describe('isoOrNull', () => {
  it('returns the ISO string of a date', () => {
    expect(isoOrNull(new Date('2025-01-15T00:00:00.000Z'))).toBe(
      '2025-01-15T00:00:00.000Z'
    );
  });

  it('returns null without a date', () => {
    expect(isoOrNull(null)).toBeNull();
  });
});

describe('periodToIsoMonth', () => {
  it('returns the first day of the month in UTC', () => {
    expect(periodToIsoMonth('202512')).toBe('2025-12-01T00:00:00.000Z');
  });

  it.each([null, '', '2025', '2025011'])('returns null for %j', (period) => {
    expect(periodToIsoMonth(period)).toBeNull();
  });
});
