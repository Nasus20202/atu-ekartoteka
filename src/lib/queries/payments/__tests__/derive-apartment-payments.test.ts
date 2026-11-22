import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';

const { mockGroupBy } = vi.hoisted(() => ({ mockGroupBy: vi.fn() }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { charge: { groupBy: mockGroupBy } },
}));

import { deriveApartmentPayments } from '@/lib/queries/payments/derive-apartment-payments';

describe('deriveApartmentPayments', () => {
  beforeEach(() => {
    mockGroupBy.mockReset();
    mockGroupBy.mockResolvedValue([]);
  });

  it('skips the charge query when no apartment has payments', async () => {
    const [derived] = await deriveApartmentPayments(
      [{ id: 'a1', payments: [] }],
      '202612'
    );

    expect(mockGroupBy).not.toHaveBeenCalled();
    expect(derived.payments).toEqual([]);
  });

  it('sums charges for all apartments from the earliest payment year', async () => {
    await deriveApartmentPayments(
      [
        {
          id: 'a1',
          payments: [createMockPayment({ year: 2025 })],
        },
        {
          id: 'a2',
          payments: [createMockPayment({ year: 2024 })],
        },
      ],
      '202612'
    );

    expect(mockGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          apartmentId: { in: ['a1', 'a2'] },
          period: { gte: '202401', lte: '202612' },
        },
      })
    );
  });
});
