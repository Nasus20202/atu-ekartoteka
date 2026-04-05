import { describe, expect, it } from 'vitest';

import { pluralizeApartments } from '@/components/ui/apartment-count';

describe('pluralizeApartments', () => {
  it('returns singular for 1', () => {
    expect(pluralizeApartments(1)).toBe('1 mieszkanie');
  });

  it('returns plural form for 2', () => {
    expect(pluralizeApartments(2)).toBe('2 mieszkania');
  });

  it('returns plural form for 3', () => {
    expect(pluralizeApartments(3)).toBe('3 mieszkania');
  });

  it('returns plural form for 4', () => {
    expect(pluralizeApartments(4)).toBe('4 mieszkania');
  });

  it('returns genitive plural for 0', () => {
    expect(pluralizeApartments(0)).toBe('0 mieszkań');
  });

  it('returns genitive plural for 5', () => {
    expect(pluralizeApartments(5)).toBe('5 mieszkań');
  });

  it('returns genitive plural for 11 (teen exception)', () => {
    expect(pluralizeApartments(11)).toBe('11 mieszkań');
  });

  it('returns genitive plural for 12 (teen exception)', () => {
    expect(pluralizeApartments(12)).toBe('12 mieszkań');
  });

  it('returns genitive plural for 14 (teen exception)', () => {
    expect(pluralizeApartments(14)).toBe('14 mieszkań');
  });

  it('returns plural form for 21', () => {
    expect(pluralizeApartments(21)).toBe('21 mieszkań');
  });

  it('returns plural form for 22', () => {
    expect(pluralizeApartments(22)).toBe('22 mieszkania');
  });

  it('returns genitive plural for 100', () => {
    expect(pluralizeApartments(100)).toBe('100 mieszkań');
  });

  it('returns genitive plural for 101', () => {
    expect(pluralizeApartments(101)).toBe('101 mieszkań');
  });
});
