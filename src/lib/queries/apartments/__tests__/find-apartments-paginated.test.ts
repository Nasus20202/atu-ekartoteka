import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockHoaFindUnique = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: { findMany: mockFindMany, count: mockCount },
    homeownersAssociation: { findUnique: mockHoaFindUnique },
  },
}));

const rows = ['10', '2', '1'].map((number) => ({
  id: `apt-${number}`,
  building: 'A',
  number,
}));

const NATURAL_ORDER = [
  { building: { sort: 'asc', nulls: 'first' } },
  { number: 'asc' },
  { id: 'asc' },
];

describe('findApartmentsPaginated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue(rows);
    mockCount.mockResolvedValue(3);
  });

  it('loads one page and the total from the database', async () => {
    const { findApartmentsPaginated } =
      await import('../find-apartments-paginated');

    const [apartments, total] = await findApartmentsPaginated({
      where: { homeownersAssociationId: 'hoa-1' },
      skip: 20,
      limit: 20,
    });

    expect(apartments).toBe(rows);
    expect(total).toBe(3);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { homeownersAssociationId: 'hoa-1' },
      orderBy: NATURAL_ORDER,
      skip: 20,
      take: 20,
    });
    expect(mockCount).toHaveBeenCalledWith({
      where: { homeownersAssociationId: 'hoa-1' },
    });
  });

  it('orders by label with the natural tie-breaker', async () => {
    const { findApartmentsPaginated } =
      await import('../find-apartments-paginated');

    await findApartmentsPaginated({
      where: {},
      skip: 0,
      limit: 20,
      sort: 'label',
      order: 'desc',
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { address: { sort: 'desc', nulls: 'first' } },
          { building: { sort: 'desc', nulls: 'first' } },
          { number: 'desc' },
          { id: 'asc' },
        ],
      })
    );
  });

  it('orders by owner, share and status', async () => {
    const { findApartmentsPaginated } =
      await import('../find-apartments-paginated');

    await findApartmentsPaginated({
      where: {},
      skip: 0,
      limit: 20,
      sort: 'owner',
      order: 'asc',
    });
    await findApartmentsPaginated({
      where: {},
      skip: 0,
      limit: 20,
      sort: 'share',
      order: 'desc',
    });
    await findApartmentsPaginated({
      where: {},
      skip: 0,
      limit: 20,
      sort: 'status',
      order: 'asc',
    });

    const orderByOf = (call: number) =>
      mockFindMany.mock.calls[call][0].orderBy;

    expect(orderByOf(0)).toEqual([
      { owner: { sort: 'asc', nulls: 'first' } },
      ...NATURAL_ORDER,
    ]);
    expect(orderByOf(1)).toEqual([
      { shareRatio: { sort: 'desc', nulls: 'first' } },
      ...NATURAL_ORDER,
    ]);
    expect(orderByOf(2)).toEqual([{ isActive: 'desc' }, ...NATURAL_ORDER]);
  });

  it('reverses null placement for the opposite sort directions', async () => {
    const { findApartmentsPaginated } =
      await import('../find-apartments-paginated');

    for (const [sort, order] of [
      ['owner', 'desc'],
      ['share', 'asc'],
      ['status', 'desc'],
    ] as const) {
      await findApartmentsPaginated({
        where: {},
        skip: 0,
        limit: 20,
        sort,
        order,
      });
    }

    const orderByOf = (call: number) =>
      mockFindMany.mock.calls[call][0].orderBy;

    expect(orderByOf(0)).toEqual([
      { owner: { sort: 'desc', nulls: 'last' } },
      ...NATURAL_ORDER,
    ]);
    expect(orderByOf(1)).toEqual([
      { shareRatio: { sort: 'asc', nulls: 'last' } },
      ...NATURAL_ORDER,
    ]);
    expect(orderByOf(2)).toEqual([{ isActive: 'asc' }, ...NATURAL_ORDER]);
  });

  it('loads the HOA only when an id is given', async () => {
    mockHoaFindUnique.mockResolvedValueOnce({ id: 'hoa-1' });
    const { findApartmentsPaginated } =
      await import('../find-apartments-paginated');

    const [, , hoa] = await findApartmentsPaginated({
      where: {},
      skip: 0,
      limit: 1,
      hoaId: 'hoa-1',
    });
    const [, , noHoa] = await findApartmentsPaginated({
      where: {},
      skip: 0,
      limit: 1,
    });

    expect(hoa).toEqual({ id: 'hoa-1' });
    expect(noHoa).toBeNull();
    expect(mockHoaFindUnique).toHaveBeenCalledTimes(1);
  });
});
