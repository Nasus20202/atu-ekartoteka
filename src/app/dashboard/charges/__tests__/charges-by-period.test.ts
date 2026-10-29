import { describe, expect, it } from 'vitest';

import { createMockCharge } from '@/__tests__/fixtures';
import {
  getCommonChargesDataDate,
  getSortedPeriods,
  groupApartmentChargesByPeriod,
  groupChargesByPeriod,
  toActivePeriod,
} from '@/app/dashboard/charges/charges-by-period';

type Apartment = Parameters<typeof groupApartmentChargesByPeriod>[0][number];

function makeApartment(overrides: Partial<Apartment> = {}): Apartment {
  return {
    id: 'apt-1',
    number: '10',
    address: 'Testowa',
    building: '1',
    charges: [],
    homeownersAssociation: { name: 'Wspólnota', chargesDataDate: null },
    ...overrides,
  } as Apartment;
}

describe('groupApartmentChargesByPeriod', () => {
  it('groups charges per period and apartment', () => {
    const result = groupApartmentChargesByPeriod([
      makeApartment({
        charges: [
          createMockCharge({ id: 'a', period: '202501' }),
          createMockCharge({ id: 'b', period: '202501' }),
          createMockCharge({ id: 'c', period: '202502' }),
        ],
      }),
      makeApartment({
        id: 'apt-2',
        number: '11',
        address: null,
        building: null,
        charges: [createMockCharge({ id: 'd', period: '202501' })],
      }),
    ]);

    expect(Object.keys(result)).toEqual(['202501', '202502']);
    expect(
      result['202501'].map((a) => [
        a.apartmentNumber,
        a.apartmentAddress,
        a.hoaName,
        a.charges.map((c) => c.id),
      ])
    ).toEqual([
      ['10', 'Testowa 1/10', 'Wspólnota', ['a', 'b']],
      ['11', '/11', 'Wspólnota', ['d']],
    ]);
    expect(result['202501'][0].charges[0].totalAmount).toBe('10.5');
  });
});

describe('getSortedPeriods', () => {
  it('returns periods from newest to oldest', () => {
    expect(
      getSortedPeriods({ '202501': [], '202503': [], '202412': [] })
    ).toEqual(['202503', '202501', '202412']);
  });
});

describe('getCommonChargesDataDate', () => {
  const hoaWithDate = (date: string | null) => ({
    name: 'Wspólnota',
    chargesDataDate: date ? new Date(date) : null,
  });

  it('returns the latest date when every HOA has one', () => {
    expect(
      getCommonChargesDataDate([
        makeApartment({
          homeownersAssociation: hoaWithDate('2025-01-01T00:00:00.000Z'),
        } as Partial<Apartment>),
        makeApartment({
          homeownersAssociation: hoaWithDate('2025-02-01T00:00:00.000Z'),
        } as Partial<Apartment>),
      ])
    ).toBe('2025-02-01T00:00:00.000Z');
  });

  it('returns null when any HOA has no date', () => {
    expect(
      getCommonChargesDataDate([
        makeApartment({
          homeownersAssociation: hoaWithDate('2025-01-01T00:00:00.000Z'),
        } as Partial<Apartment>),
        makeApartment(),
      ])
    ).toBeNull();
  });
});

describe('groupChargesByPeriod', () => {
  it('groups display charges by period', () => {
    const result = groupChargesByPeriod([
      createMockCharge({ id: 'a', period: '202501' }),
      createMockCharge({ id: 'b', period: '202502' }),
      createMockCharge({ id: 'c', period: '202501' }),
    ]);

    expect(result['202501'].map((c) => c.id)).toEqual(['a', 'c']);
    expect(result['202502'][0].dateFrom).toBe('2025-01-01T00:00:00.000Z');
  });
});

describe('toActivePeriod', () => {
  it('converts a YYYY-MM month to a YYYYMM period', () => {
    expect(toActivePeriod('2025-03')).toBe('202503');
  });

  it('returns null without a month', () => {
    expect(toActivePeriod(undefined)).toBeNull();
  });
});
