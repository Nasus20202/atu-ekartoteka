import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  derive: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { apartment: { findUnique: mocks.findUnique } },
}));
vi.mock('@/lib/queries/payments/derive-apartment-payments', () => ({
  deriveApartmentPayments: mocks.derive,
}));

import { findApartmentDetail } from '@/lib/queries/apartments/find-apartment-detail';

describe('findApartmentDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null for an unknown apartment', async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(findApartmentDetail('missing', '2025-03')).resolves.toBeNull();
    expect(mocks.derive).not.toHaveBeenCalled();
  });

  it('loads the apartment with its relations and derives its payments', async () => {
    const apartment = { id: 'apt-1' };
    mocks.findUnique.mockResolvedValue(apartment);
    mocks.derive.mockResolvedValue([{ id: 'apt-1', payments: [] }]);

    await expect(findApartmentDetail('apt-1', '2025-03')).resolves.toEqual({
      id: 'apt-1',
      payments: [],
    });
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1' },
        include: expect.objectContaining({
          charges: { orderBy: { period: 'desc' } },
          payments: { orderBy: { year: 'desc' } },
        }),
      })
    );
    expect(mocks.derive).toHaveBeenCalledWith([apartment], '2025-03');
  });
});
