import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindFirst, mockFindUnique } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: { findFirst: mockFindFirst, findUnique: mockFindUnique },
  },
}));

import {
  findApartmentWithHoaName,
  findOwnedApartmentLabel,
} from '@/lib/queries/apartments/find-apartment-label';

describe('findOwnedApartmentLabel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects the address parts of an apartment owned by the user', async () => {
    const label = { address: 'Kwiatowa', building: '52', number: '4' };
    mockFindFirst.mockResolvedValue(label);

    await expect(findOwnedApartmentLabel('apt-1', 'user-1')).resolves.toEqual(
      label
    );

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'apt-1', userId: 'user-1' },
      select: { address: true, building: true, number: true },
    });
  });

  it('returns null when the apartment belongs to someone else', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      findOwnedApartmentLabel('apt-1', 'user-2')
    ).resolves.toBeNull();
  });
});

describe('findApartmentWithHoaName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects the apartment number and its HOA name', async () => {
    const apartment = { number: '4', homeownersAssociation: { name: 'KLO11' } };
    mockFindUnique.mockResolvedValue(apartment);

    await expect(findApartmentWithHoaName('apt-1')).resolves.toEqual(apartment);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'apt-1' },
      select: {
        number: true,
        homeownersAssociation: { select: { name: true } },
      },
    });
  });

  it('returns null for an unknown apartment', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(findApartmentWithHoaName('missing')).resolves.toBeNull();
  });
});
