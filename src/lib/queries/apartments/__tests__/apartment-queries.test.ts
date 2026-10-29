import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindFirst, mockFindMany } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: { findFirst: mockFindFirst, findMany: mockFindMany },
  },
}));

import { findApartmentWithCharges } from '@/lib/queries/apartments/find-apartment-with-charges';
import { findApartmentWithPaymentsByYear } from '@/lib/queries/apartments/find-apartment-with-payments-by-year';
import { findApartmentsByIds } from '@/lib/queries/apartments/find-apartments-by-ids';
import { findAssignedApartmentAddressKeys } from '@/lib/queries/apartments/find-assigned-apartment-address-keys';

describe('apartment queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds an apartment with charges only for its owner', async () => {
    await findApartmentWithCharges('apt-1', 'user-1');

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1', userId: 'user-1' },
        include: expect.objectContaining({
          charges: {
            orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
          },
        }),
      })
    );
  });

  it('finds an apartment with payments of a single year for its owner', async () => {
    await findApartmentWithPaymentsByYear('apt-1', 'user-1', 2025);

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1', userId: 'user-1' },
        include: expect.objectContaining({
          payments: { where: { year: 2025 } },
        }),
      })
    );
  });

  it('finds apartments by ids with their users', async () => {
    await findApartmentsByIds(['a', 'b']);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] } },
      include: { user: true },
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
