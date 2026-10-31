import { describe, expect, it, vi } from 'vitest';

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { payment: { findMany: mockFindMany } },
}));

import { findLatestChargedPayments } from '@/lib/queries/payments/find-latest-charged-payments';

describe('findLatestChargedPayments', () => {
  it('selects the newest charged year per apartment', async () => {
    mockFindMany.mockResolvedValue([{ year: 2026, augustCharges: 5 }]);

    await findLatestChargedPayments({ userId: 'user-1' });

    const args = mockFindMany.mock.calls[0][0];
    expect(args.where.apartment).toEqual({ userId: 'user-1' });
    expect(args.where.apartmentId).toBeUndefined();
    expect(args.where.OR).toHaveLength(12);
    expect(args.where.OR[0]).toEqual({ januaryCharges: { not: 0 } });
    expect(args.distinct).toEqual(['apartmentId']);
    expect(args.orderBy).toEqual({ year: 'desc' });
    expect(args.select).toMatchObject({ year: true, decemberCharges: true });
  });
});

describe('findLatestChargedPayments for one apartment', () => {
  it('limits the query to that apartment of the owner', async () => {
    mockFindMany.mockResolvedValue([]);

    await findLatestChargedPayments({ userId: 'user-1', apartmentId: 'apt-1' });

    const args = mockFindMany.mock.calls.at(-1)?.[0];
    expect(args.where.apartment).toEqual({ userId: 'user-1' });
    expect(args.where.apartmentId).toBe('apt-1');
  });
});
