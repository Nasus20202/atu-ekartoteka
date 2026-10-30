import { describe, expect, it } from 'vitest';

import {
  buildAddressKey,
  computeDuplicateActiveAddresses,
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
