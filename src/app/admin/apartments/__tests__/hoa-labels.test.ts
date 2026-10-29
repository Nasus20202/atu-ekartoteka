import { describe, expect, it } from 'vitest';

import {
  formatImportDate,
  getApartmentCountLabel,
  getHoaCountLabel,
} from '@/app/admin/apartments/hoa-labels';

describe('formatImportDate', () => {
  it('formats an ISO date in Polish locale', () => {
    expect(formatImportDate('2025-03-07T12:00:00.000Z')).toBe('7.03.2025');
  });

  it('returns null without a date', () => {
    expect(formatImportDate(null)).toBeNull();
  });
});

describe('getHoaCountLabel', () => {
  it.each([
    [1, 'wspólnotę'],
    [2, 'wspólnoty'],
    [4, 'wspólnoty'],
    [5, 'wspólnot'],
  ])('labels %i HOAs as %s', (count, label) => {
    expect(getHoaCountLabel(count)).toBe(label);
  });
});

describe('getApartmentCountLabel', () => {
  it.each([
    [1, 'mieszkanie'],
    [3, 'mieszkania'],
    [12, 'mieszkań'],
  ])('labels %i apartments as %s', (count, label) => {
    expect(getApartmentCountLabel(count)).toBe(label);
  });
});
