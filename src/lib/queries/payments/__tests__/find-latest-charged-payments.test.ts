import { describe, expect, it, vi } from 'vitest';

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { payment: { findMany: mockFindMany } },
}));

import { findLatestChargedPayments } from '@/lib/queries/payments/find-latest-charged-payments';

describe('findLatestChargedPayments', () => {
  it('selects the newest charged year per apartment', async () => {
    mockFindMany.mockResolvedValue([{ year: 2026, augustCharges: 5 }]);

    await findLatestChargedPayments(['apt-1', 'apt-2']);

    const args = mockFindMany.mock.calls[0][0];
    expect(args.where.apartmentId).toEqual({ in: ['apt-1', 'apt-2'] });
    expect(args.where.OR).toHaveLength(12);
    expect(args.where.OR[0]).toEqual({ januaryCharges: { not: 0 } });
    expect(args.distinct).toEqual(['apartmentId']);
    expect(args.orderBy).toEqual({ year: 'desc' });
    expect(args.select).toMatchObject({ year: true, decemberCharges: true });
  });
});
