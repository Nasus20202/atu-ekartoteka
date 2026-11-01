import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindFirst, mockFindMany, mockCount, mockGroupBy } = vi.hoisted(
  () => ({
    mockFindFirst: vi.fn(),
    mockFindMany: vi.fn(),
    mockCount: vi.fn(),
    mockGroupBy: vi.fn().mockResolvedValue([]),
  })
);

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      count: mockCount,
    },
    charge: { groupBy: mockGroupBy },
  },
}));

import { countApartmentAvailability } from '@/lib/queries/apartments/count-apartment-availability';
import { findApartmentWithCharges } from '@/lib/queries/apartments/find-apartment-with-charges';
import { findApartmentWithPaymentsByYear } from '@/lib/queries/apartments/find-apartment-with-payments-by-year';
import { findAssignedApartmentAddressKeys } from '@/lib/queries/apartments/find-assigned-apartment-address-keys';

describe('apartment queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds an apartment with charges only for its owner', async () => {
    await findApartmentWithCharges('apt-1', 'user-1', 2025, '202608');

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1', userId: 'user-1' },
        include: expect.objectContaining({
          charges: {
            where: { period: { gte: '202501', lte: '202608' } },
            orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
          },
        }),
      })
    );
  });

  it('finds an apartment with payments of a single year for its owner', async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    await findApartmentWithPaymentsByYear(
      'apt-1',
      'user-1',
      2025,
      2025,
      '202611'
    );

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1', userId: 'user-1' },
        include: expect.objectContaining({
          payments: { where: { year: 2025 } },
          charges: { where: { period: { gte: '202501' } } },
        }),
      })
    );
  });

  it('returns null without querying for a year before the window', async () => {
    await expect(
      findApartmentWithPaymentsByYear('apt-1', 'user-1', 2024, 2025, '202611')
    ).resolves.toBeNull();
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('derives monthly charges and the closing balance from charge records', async () => {
    const months = Object.fromEntries(
      [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ].map((month) => [`${month}Payments`, 0])
    );
    mockFindFirst.mockResolvedValueOnce({
      id: 'apt-1',
      payments: [
        {
          year: 2025,
          openingBalance: 100,
          legacyClosingBalance: 999,
          legacyJanuaryCharges: 1,
          ...months,
          januaryPayments: 50,
        },
      ],
    });
    mockGroupBy.mockResolvedValueOnce([
      { apartmentId: 'apt-1', period: '202501', _sum: { totalAmount: 120 } },
    ]);

    const apartment = await findApartmentWithPaymentsByYear(
      'apt-1',
      'user-1',
      2025,
      2025,
      '202611'
    );

    expect(apartment?.payments[0].calculatedJanuaryCharges.toNumber()).toBe(
      120
    );
    expect(apartment?.payments[0].calculatedClosingBalance.toNumber()).toBe(30);
    expect(apartment?.payments[0]).not.toHaveProperty('legacyClosingBalance');
    expect(mockGroupBy.mock.calls[0][0].where).toEqual({
      apartmentId: { in: ['apt-1'] },
      period: { gte: '202501', lte: '202611' },
    });
  });

  it('counts existing and foreign-owned apartments in the database', async () => {
    mockCount.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const result = await countApartmentAvailability(['a', 'b'], 'user-1');

    expect(result).toEqual({ found: 2, occupiedByOthers: 1 });
    expect(mockCount).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ['a', 'b'] } },
    });
    expect(mockCount).toHaveBeenNthCalledWith(2, {
      where: {
        id: { in: ['a', 'b'] },
        AND: [{ userId: { not: null } }, { userId: { not: 'user-1' } }],
      },
    });
  });

  it('maps assigned apartments to address keys', async () => {
    mockFindMany.mockResolvedValue([
      { homeownersAssociationId: 'hoa-1', building: 'A', number: '1' },
    ]);

    await expect(findAssignedApartmentAddressKeys(['hoa-1'])).resolves.toEqual([
      { hoaId: 'hoa-1', building: 'A', number: '1' },
    ]);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: { not: null },
          homeownersAssociationId: { in: ['hoa-1'] },
        },
      })
    );
  });
});
