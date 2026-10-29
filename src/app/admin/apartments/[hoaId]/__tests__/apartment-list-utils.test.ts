import { describe, expect, it } from 'vitest';

import {
  buildAddressKey,
  computeDuplicateActiveAddresses,
  getFoundApartmentsLabel,
  getPageItems,
} from '@/app/admin/apartments/[hoaId]/apartment-list-utils';

const apartment = (
  number: string,
  isActive = true,
  building: string | null = 'A'
) => ({ address: 'Testowa', building, number, isActive });

describe('buildAddressKey', () => {
  it('joins address parts and tolerates missing values', () => {
    expect(buildAddressKey(apartment('1'))).toBe('Testowa__A__1');
    expect(
      buildAddressKey({ address: null, building: null, number: '2' })
    ).toBe('____2');
  });
});

describe('computeDuplicateActiveAddresses', () => {
  it('returns addresses shared by more than one active apartment', () => {
    const duplicates = computeDuplicateActiveAddresses([
      apartment('1'),
      apartment('1'),
      apartment('2'),
      apartment('2', false),
      apartment('3', false),
      apartment('3', false),
    ]);

    expect([...duplicates]).toEqual(['Testowa__A__1']);
  });
});

describe('getPageItems', () => {
  it('lists every page when there are few pages', () => {
    expect(getPageItems(1, 3)).toEqual([1, 2, 3]);
  });

  it('shows first, last and pages near the current one with ellipses', () => {
    expect(getPageItems(10, 20)).toEqual([
      1,
      'ellipsis',
      8,
      9,
      10,
      11,
      12,
      'ellipsis',
      20,
    ]);
  });

  it('omits ellipses where pages are adjacent to the edges', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 3, 'ellipsis', 10]);
  });
});

describe('getFoundApartmentsLabel', () => {
  it.each([
    [0, 'mieszkań'],
    [1, 'mieszkanie'],
    [2, 'mieszkania'],
    [5, 'mieszkań'],
  ])('labels %i apartments as %s', (count, label) => {
    expect(getFoundApartmentsLabel(count)).toBe(label);
  });
});
