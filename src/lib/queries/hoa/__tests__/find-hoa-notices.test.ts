import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { homeownersAssociation: { findMany: mockFindMany } },
}));

import { findHoaNotices } from '@/lib/queries/hoa/find-hoa-notices';

describe('findHoaNotices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the notice fields of every HOA sorted by name', async () => {
    const notices = [
      {
        id: 'hoa-1',
        externalId: 'KLO11',
        name: 'Klonowa',
        header: 'nagłówek',
        footer: 'stopka',
      },
    ];
    mockFindMany.mockResolvedValue(notices);

    await expect(findHoaNotices()).resolves.toEqual(notices);

    expect(mockFindMany).toHaveBeenCalledWith({
      select: {
        id: true,
        externalId: true,
        name: true,
        header: true,
        footer: true,
      },
      orderBy: { name: 'asc' },
    });
  });

  it('returns an empty list when no HOA exists', async () => {
    mockFindMany.mockResolvedValue([]);

    await expect(findHoaNotices()).resolves.toEqual([]);
  });
});
