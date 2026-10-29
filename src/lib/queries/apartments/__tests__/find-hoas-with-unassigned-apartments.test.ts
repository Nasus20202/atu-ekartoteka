import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHoaFindMany = vi.fn();
const mockHoaCount = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    homeownersAssociation: {
      findMany: mockHoaFindMany,
      count: mockHoaCount,
    },
  },
}));

describe('findHoasWithUnassignedApartments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHoaFindMany.mockResolvedValue([{ id: 'hoa-1' }]);
    mockHoaCount.mockResolvedValue(7);
  });

  it('returns one page of HOA ids with the total', async () => {
    const { findHoasWithUnassignedApartments } =
      await import('../find-hoas-with-unassigned-apartments');

    await expect(
      findHoasWithUnassignedApartments(
        { notIn: ['a@example.com'] },
        { skip: 10, limit: 5 }
      )
    ).resolves.toEqual([[{ id: 'hoa-1' }], 7]);
  });

  it('filters, orders and counts by the same unassigned condition', async () => {
    const { findHoasWithUnassignedApartments } =
      await import('../find-hoas-with-unassigned-apartments');
    const where = {
      apartments: {
        some: { userId: null, email: { not: null, in: ['a@example.com'] } },
      },
    };

    await findHoasWithUnassignedApartments(
      { in: ['a@example.com'] },
      { skip: 10, limit: 5 }
    );

    expect(mockHoaFindMany).toHaveBeenCalledWith({
      where,
      select: { id: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: 10,
      take: 5,
    });
    expect(mockHoaCount).toHaveBeenCalledWith({ where });
  });
});
