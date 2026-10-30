import { describe, expect, it } from 'vitest';

import {
  createMockChargeNotification,
  createMockPayment,
} from '@/__tests__/fixtures';
import {
  buildApartmentBalances,
  buildDashboardNotifications,
  getChargesForPeriod,
  getDashboardPeriods,
} from '@/app/dashboard/dashboard-data';
import { getSeriesColor } from '@/components/charts/chart-colors';
import { Prisma } from '@/generated/prisma/browser';

type Apartment = Parameters<typeof buildApartmentBalances>[0][number];

const hoa = {
  id: 'hoa-1',
  name: 'Wspólnota 1',
  header: 'Nagłówek',
  footer: 'Stopka',
};

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
      hoaFooter: 'Stopka',
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
      hoaFooter: null,
    });
  });
});

describe('buildApartmentBalances', () => {
  it('returns the latest closing balance and link for every apartment', () => {
    const balances = buildApartmentBalances(
      [
        makeApartment({
          payments: [
            createMockPayment({
              year: 2025,
              closingBalance: new Prisma.Decimal(-4),
            }),
            createMockPayment({ year: 2024 }),
          ],
        }),
        makeApartment({
          id: 'apt-2',
          number: '11',
          homeownersAssociation:
            null as unknown as Apartment['homeownersAssociation'],
          payments: [
            createMockPayment({ closingBalance: new Prisma.Decimal(3) }),
          ],
        }),
      ],
      '202512'
    );

    expect(
      balances.map((balance) => [
        balance.apartmentId,
        balance.apartmentLabel,
        balance.hoaName,
        balance.closingBalance.toString(),
        balance.href,
      ])
    ).toEqual([
      [
        'apt-1',
        'Testowa 1/10',
        'Wspólnota 1',
        '-4',
        '/dashboard/payments/apt-1/2025',
      ],
      ['apt-2', 'Testowa 1/11', null, '3', '/dashboard/payments/apt-2/2024'],
    ]);
  });

  it('builds the monthly balance history for each apartment', () => {
    const [balance] = buildApartmentBalances(
      [
        makeApartment({
          payments: [
            createMockPayment({
              year: 2025,
              openingBalance: new Prisma.Decimal(10),
              januaryCharges: new Prisma.Decimal(30),
            }),
          ],
        }),
      ],
      '202502'
    );

    expect(balance.history.map((datum) => datum.balance)).toEqual([-20, -20]);
  });

  it('skips apartments without payments but keeps their color slot', () => {
    const balances = buildApartmentBalances(
      [makeApartment(), makeApartment({ payments: [createMockPayment()] })],
      '202501'
    );

    expect(balances.map((balance) => balance.color)).toEqual([
      getSeriesColor(1),
    ]);
  });
});
