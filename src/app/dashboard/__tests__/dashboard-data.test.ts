import { describe, expect, it } from 'vitest';

import {
  createMockChargeNotification,
  createMockPayment,
} from '@/__tests__/fixtures';
import {
  buildDashboardNotifications,
  buildHoaPaymentGroups,
  getChargesForPeriod,
  getDashboardPeriods,
} from '@/app/dashboard/dashboard-data';
import { Prisma } from '@/generated/prisma/browser';

type Apartment = Parameters<typeof buildHoaPaymentGroups>[0][number];

const hoa = { id: 'hoa-1', name: 'Wspólnota 1', header: 'Nagłówek' };

function makeApartment(overrides: Partial<Apartment> = {}): Apartment {
  return {
    id: 'apt-1',
    number: '10',
    address: 'Testowa',
    building: '1',
    charges: [],
    chargeNotifications: [],
    payments: [],
    homeownersAssociation: hoa,
    ...overrides,
  } as Apartment;
}

describe('getDashboardPeriods', () => {
  it('returns the current and previous month periods', () => {
    expect(getDashboardPeriods(new Date(2025, 5, 15))).toEqual({
      currentPeriod: '202506',
      previousPeriod: '202505',
    });
  });

  it('rolls the previous period over to December of the last year', () => {
    expect(getDashboardPeriods(new Date(2025, 0, 1))).toEqual({
      currentPeriod: '202501',
      previousPeriod: '202412',
    });
  });
});

describe('getChargesForPeriod', () => {
  it('collects charges of the period from all apartments', () => {
    const charge = (id: string, period: string) => ({
      id,
      period,
      totalAmount: new Prisma.Decimal(1),
    });
    const apartments = [
      makeApartment({
        charges: [charge('a', '202501'), charge('b', '202412')],
      }),
      makeApartment({ id: 'apt-2', charges: [charge('c', '202501')] }),
    ];

    expect(getChargesForPeriod(apartments, '202501').map((c) => c.id)).toEqual([
      'a',
      'c',
    ]);
  });
});

describe('buildDashboardNotifications', () => {
  it('stringifies decimals and adds apartment and HOA details', () => {
    const [notification] = buildDashboardNotifications([
      makeApartment({
        chargeNotifications: [createMockChargeNotification()],
      }),
    ]);

    expect(notification).toMatchObject({
      quantity: '2',
      unitPrice: '12.5',
      totalAmount: '25',
      apartmentNumber: '10',
      apartmentAddress: 'Testowa 1/10',
      hoaId: 'hoa-1',
      hoaName: 'Wspólnota 1',
      hoaHeader: 'Nagłówek',
    });
  });

  it('collapses the gap left by a missing building', () => {
    const [notification] = buildDashboardNotifications([
      makeApartment({
        building: null,
        chargeNotifications: [createMockChargeNotification()],
      }),
    ]);

    expect(notification.apartmentAddress).toBe('Testowa /10');
  });

  it('uses null HOA fields when the apartment has no HOA', () => {
    const [notification] = buildDashboardNotifications([
      makeApartment({
        homeownersAssociation:
          null as unknown as Apartment['homeownersAssociation'],
        chargeNotifications: [createMockChargeNotification()],
      }),
    ]);

    expect(notification).toMatchObject({
      hoaId: null,
      hoaName: null,
      hoaHeader: null,
    });
  });
});

describe('buildHoaPaymentGroups', () => {
  it('sums the latest closing balances per HOA', () => {
    const groups = buildHoaPaymentGroups([
      makeApartment({
        payments: [
          createMockPayment({ closingBalance: new Prisma.Decimal(10) }),
        ],
      }),
      makeApartment({
        id: 'apt-2',
        payments: [
          createMockPayment({ closingBalance: new Prisma.Decimal(-4) }),
        ],
      }),
      makeApartment({
        id: 'apt-3',
        homeownersAssociation: {
          id: 'hoa-2',
          name: 'Wspólnota 2',
          header: null,
        },
        payments: [
          createMockPayment({ closingBalance: new Prisma.Decimal(3) }),
        ],
      }),
    ]);

    expect(
      groups.map((g) => [g.hoaId, g.hoaName, g.totalClosingBalance.toString()])
    ).toEqual([
      ['hoa-1', 'Wspólnota 1', '6'],
      ['hoa-2', 'Wspólnota 2', '3'],
    ]);
  });

  it('skips apartments without payments or HOA', () => {
    expect(
      buildHoaPaymentGroups([
        makeApartment(),
        makeApartment({
          homeownersAssociation:
            null as unknown as Apartment['homeownersAssociation'],
          payments: [createMockPayment()],
        }),
      ])
    ).toEqual([]);
  });
});
