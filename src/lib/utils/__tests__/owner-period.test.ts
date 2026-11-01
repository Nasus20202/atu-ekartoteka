import { describe, expect, it } from 'vitest';

import { formatOwnerPeriod } from '@/lib/utils/owner-period';

describe('formatOwnerPeriod', () => {
  it('shows start and end for a former owner', () => {
    expect(
      formatOwnerPeriod('2020-01-01T12:00:00.000Z', '2020-01-31T12:00:00.000Z')
    ).toBe('od 01.01.2020 do 31.01.2020');
  });

  it('shows only the start for the current owner', () => {
    expect(formatOwnerPeriod('2020-02-01T12:00:00.000Z', null)).toBe(
      'od 01.02.2020'
    );
  });

  it('shows only the end when the start is unknown', () => {
    expect(formatOwnerPeriod(null, '2020-01-31T12:00:00.000Z')).toBe(
      'do 31.01.2020'
    );
  });

  it('shows Brak when neither date is known', () => {
    expect(formatOwnerPeriod(null, null)).toBe('Brak');
  });
});
