import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGroupBy } = vi.hoisted(() => ({ mockGroupBy: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { charge: { groupBy: mockGroupBy } },
}));

import { Prisma } from '@/generated/prisma/browser';
import { findChargeTotalsByPeriod } from '@/lib/queries/charges/find-charge-totals-by-period';

describe('findChargeTotalsByPeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates the user charges of the requested periods inside the window', async () => {
    mockGroupBy.mockResolvedValueOnce([]);

    await findChargeTotalsByPeriod('user-1', 2025, ['202612', '202611']);

    expect(mockGroupBy).toHaveBeenCalledWith({
      by: ['period'],
      where: {
        apartment: { userId: 'user-1' },
        period: { gte: '202501', in: ['202612', '202611'] },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
  });

  it('maps each period to its line count and total', async () => {
    mockGroupBy.mockResolvedValueOnce([
      {
        period: '202611',
        _count: { _all: 2 },
        _sum: { totalAmount: new Prisma.Decimal(150) },
      },
    ]);

    const totals = await findChargeTotalsByPeriod('user-1', 2025, ['202611']);

    expect(totals.get('202611')?.count).toBe(2);
    expect(totals.get('202611')?.total.toFixed(2)).toBe('150.00');
  });

  it('treats a missing sum as zero', async () => {
    mockGroupBy.mockResolvedValueOnce([
      { period: '202611', _count: { _all: 1 }, _sum: { totalAmount: null } },
    ]);

    const totals = await findChargeTotalsByPeriod('user-1', 2025, ['202611']);

    expect(totals.get('202611')?.total.toFixed(2)).toBe('0.00');
  });
});
