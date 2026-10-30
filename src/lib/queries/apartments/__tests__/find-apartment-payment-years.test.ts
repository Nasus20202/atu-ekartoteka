import { describe, expect, it, vi } from 'vitest';

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { payment: { findMany: mockFindMany } },
}));

import { findApartmentPaymentYears } from '@/lib/queries/apartments/find-apartment-payment-years';

describe('findApartmentPaymentYears', () => {
  it('returns the owner apartment payment years newest first', async () => {
    mockFindMany.mockResolvedValue([{ year: 2025 }, { year: 2024 }]);

    await expect(findApartmentPaymentYears('apt-1', 'user-1')).resolves.toEqual(
      [2025, 2024]
    );
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { apartmentId: 'apt-1', apartment: { userId: 'user-1' } },
      select: { year: true },
      orderBy: { year: 'desc' },
    });
  });
});
