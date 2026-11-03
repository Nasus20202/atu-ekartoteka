import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindUnique, mockDerivePayments } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockDerivePayments: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    charge: { groupBy: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/lib/queries/payments/derive-apartment-payments', () => ({
  deriveApartmentPayments: mockDerivePayments,
}));

import { findUserProfile } from '@/lib/queries/users/find-user-profile';
import { findUserWithApartmentCharges } from '@/lib/queries/users/find-user-with-apartment-charges';
import { findUserWithApartmentPayments } from '@/lib/queries/users/find-user-with-apartment-payments';
import { findUserWithApartments } from '@/lib/queries/users/find-user-with-apartments';

describe('user queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for an unknown user without deriving payments', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    await expect(
      findUserWithApartmentPayments('missing', 2025, '202611')
    ).resolves.toBeNull();
  });

  it('selects only the profile fields', async () => {
    await findUserProfile('user-1');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { name: true, email: true, authMethod: true },
    });
  });

  it('includes apartment charges in the window, newest period first', async () => {
    await findUserWithApartmentCharges('user-1', 2025, '202608');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      include: {
        apartments: {
          include: {
            homeownersAssociation: true,
            charges: {
              where: { period: { gte: '202501', lte: '202608' } },
              orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
            },
          },
        },
      },
    });
  });

  it('includes apartment payments in the window, newest year first', async () => {
    await findUserWithApartmentPayments('user-1', 2025, '202611');

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          apartments: expect.objectContaining({
            orderBy: { number: 'asc' },
            include: expect.objectContaining({
              payments: {
                where: { year: { gte: 2025 } },
                orderBy: { year: 'desc' },
              },
            }),
          }),
        },
      })
    );
  });

  it('includes window payment years and charges for the dashboard', async () => {
    await findUserWithApartments('user-1', 2025, '202611');

    const { include } = mockFindUnique.mock.calls[0][0];
    expect(include.apartments.include.payments).toEqual({
      where: { year: { gte: 2025 } },
      orderBy: { year: 'desc' },
    });
    expect(include.apartments.include.homeownersAssociation.select).toEqual({
      id: true,
      name: true,
      header: true,
      footer: true,
    });
    expect(include.apartments.include.charges).toBeUndefined();
  });

  it('returns the dashboard user with payments derived from charges', async () => {
    const apartments = [{ id: 'apt-1', payments: [] }];
    const derived = [{ id: 'apt-1', payments: [{ year: 2025 }] }];
    mockFindUnique.mockResolvedValueOnce({ id: 'user-1', apartments });
    mockDerivePayments.mockResolvedValueOnce(derived);

    await expect(
      findUserWithApartments('user-1', 2025, '202611')
    ).resolves.toEqual({ id: 'user-1', apartments: derived });

    expect(mockDerivePayments).toHaveBeenCalledWith(apartments, '202611');
  });

  it('returns the profile user with payments derived from charges', async () => {
    const apartments = [{ id: 'apt-2', payments: [] }];
    const derived = [{ id: 'apt-2', payments: [{ year: 2024 }] }];
    mockFindUnique.mockResolvedValueOnce({ id: 'user-2', apartments });
    mockDerivePayments.mockResolvedValueOnce(derived);

    await expect(
      findUserWithApartmentPayments('user-2', 2025, '202611')
    ).resolves.toEqual({ id: 'user-2', apartments: derived });

    expect(mockDerivePayments).toHaveBeenCalledWith(apartments, '202611');
  });
});
