import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindFirst, mockFindMany, mockCount } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      count: mockCount,
    },
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

  it('does not limit charges without a cutoff', async () => {
    await findApartmentWithCharges('apt-1', 'user-1', 2025, null);

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          charges: expect.objectContaining({
            where: { period: { gte: '202501' } },
          }),
        }),
      })
    );
  });

  it('finds an apartment with payments of a single year for its owner', async () => {
    await findApartmentWithPaymentsByYear('apt-1', 'user-1', 2025, 2025);

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
      findApartmentWithPaymentsByYear('apt-1', 'user-1', 2024, 2025)
    ).resolves.toBeNull();
    expect(mockFindFirst).not.toHaveBeenCalled();
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
