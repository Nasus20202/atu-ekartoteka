import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindUnique } = vi.hoisted(() => ({ mockFindUnique: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { homeownersAssociation: { findUnique: mockFindUnique } },
}));

import { findHoaName } from '@/lib/queries/hoa/find-hoa-name';

describe('findHoaName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects only the name of the HOA', async () => {
    mockFindUnique.mockResolvedValue({ name: 'KLO11' });

    await expect(findHoaName('hoa-1')).resolves.toEqual({ name: 'KLO11' });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'hoa-1' },
      select: { name: true },
    });
  });

  it('returns null for an unknown HOA', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(findHoaName('missing')).resolves.toBeNull();
  });
});
