import { describe, expect, it, vi } from 'vitest';

const { mockGroupBy } = vi.hoisted(() => ({ mockGroupBy: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { charge: { groupBy: mockGroupBy } },
}));

import { findMonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';

describe('findMonthlyChargeSums', () => {
  it('groups charge records by apartment and period', async () => {
    mockGroupBy.mockResolvedValue([
      { apartmentId: 'a1', period: '202601', _sum: { totalAmount: '100.5' } },
      { apartmentId: 'a1', period: '202602', _sum: { totalAmount: '-20' } },
      { apartmentId: 'a2', period: '202601', _sum: { totalAmount: null } },
    ]);

    const sums = await findMonthlyChargeSums(['a1', 'a2'], {
      fromPeriod: '202601',
      toPeriod: '202612',
    });

    expect(mockGroupBy).toHaveBeenCalledWith({
      by: ['apartmentId', 'period'],
      where: {
        apartmentId: { in: ['a1', 'a2'] },
        period: { gte: '202601', lte: '202612' },
      },
      _sum: { totalAmount: true },
    });
    expect(sums.get('a1')?.get('202601')?.toString()).toBe('100.5');
    expect(sums.get('a1')?.get('202602')?.toString()).toBe('-20');
    expect(sums.get('a2')?.get('202601')?.toString()).toBe('0');
  });

  it('leaves the period unbounded without a range', async () => {
    mockGroupBy.mockResolvedValue([]);

    await findMonthlyChargeSums(['a1']);

    expect(mockGroupBy.mock.calls.at(-1)?.[0].where.period).toEqual({});
  });

  it('skips the query without apartments', async () => {
    mockGroupBy.mockClear();

    const sums = await findMonthlyChargeSums([]);

    expect(sums.size).toBe(0);
    expect(mockGroupBy).not.toHaveBeenCalled();
  });
});
