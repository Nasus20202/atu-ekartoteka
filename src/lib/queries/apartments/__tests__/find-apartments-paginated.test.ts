import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindMany = vi.fn();
const mockHoaFindUnique = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: { findMany: mockFindMany },
    homeownersAssociation: { findUnique: mockHoaFindUnique },
  },
}));

const rows = ['10', '2', '1'].map((number) => ({
  id: `apt-${number}`,
  building: 'A',
  number,
}));

function mockRows() {
  mockFindMany.mockImplementation(
    async ({ select, where }: { select?: object; where: any }) =>
      select ? rows : rows.filter((row) => where.id.in.includes(row.id))
  );
}

describe('findApartmentsPaginated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRows();
  });

  it('returns the requested page in natural order with the total of all matches', async () => {
    const { findApartmentsPaginated } =
      await import('../find-apartments-paginated');

    const [apartments, total] = await findApartmentsPaginated({
      where: {},
      skip: 1,
      limit: 2,
    });

    expect(apartments.map((a) => a.number)).toEqual(['2', '10']);
    expect(total).toBe(3);
  });

  it('loads full rows only for the page', async () => {
    const { findApartmentsPaginated } =
      await import('../find-apartments-paginated');

    await findApartmentsPaginated({
      where: { isActive: true },
      skip: 0,
      limit: 1,
    });

    expect(mockFindMany).toHaveBeenNthCalledWith(1, {
      where: { isActive: true },
      select: { id: true, building: true, number: true },
    });
    expect(mockFindMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: ['apt-1'] } },
    });
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
