import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindUnique } = vi.hoisted(() => ({ mockFindUnique: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { user: { findUnique: mockFindUnique } },
}));

import { findUserProfile } from '@/lib/queries/users/find-user-profile';
import { findUserWithApartmentCharges } from '@/lib/queries/users/find-user-with-apartment-charges';
import { findUserWithApartmentPayments } from '@/lib/queries/users/find-user-with-apartment-payments';
import { findUserWithApartments } from '@/lib/queries/users/find-user-with-apartments';

describe('user queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects only the profile fields', async () => {
    await findUserProfile('user-1');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { name: true, email: true, authMethod: true },
    });
  });

  it('includes apartment charges ordered by newest period', async () => {
    await findUserWithApartmentCharges('user-1');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      include: {
        apartments: {
          include: {
            homeownersAssociation: true,
            charges: {
              orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
            },
          },
        },
      },
    });
  });

  it('includes apartment payments ordered by newest year', async () => {
    await findUserWithApartmentPayments('user-1');

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          apartments: expect.objectContaining({
            orderBy: { number: 'asc' },
            include: expect.objectContaining({
              payments: { orderBy: { year: 'desc' } },
            }),
          }),
        },
      })
    );
  });

  it('includes only the latest payment for the dashboard', async () => {
    await findUserWithApartments('user-1');

    const { include } = mockFindUnique.mock.calls[0][0];
    expect(include.apartments.include.payments).toEqual({
      orderBy: { year: 'desc' },
      take: 1,
    });
    expect(include.apartments.include.charges.select).toEqual({
      id: true,
      period: true,
      totalAmount: true,
    });
  });
});
