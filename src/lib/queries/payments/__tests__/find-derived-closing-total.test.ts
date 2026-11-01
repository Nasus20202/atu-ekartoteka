import { describe, expect, it, vi } from 'vitest';

const { mockPaymentAggregate, mockChargeAggregate } = vi.hoisted(() => ({
  mockPaymentAggregate: vi.fn(),
  mockChargeAggregate: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    payment: { aggregate: mockPaymentAggregate },
    charge: { aggregate: mockChargeAggregate },
  },
}));

import { findDerivedClosingTotal } from '@/lib/queries/payments/find-derived-closing-total';

describe('findDerivedClosingTotal', () => {
  it('returns zero without apartments and skips the queries', async () => {
    const total = await findDerivedClosingTotal(new Map(), '202611');

    expect(total.toNumber()).toBe(0);
    expect(mockPaymentAggregate).not.toHaveBeenCalled();
  });

  it('adds opening balance and payments and subtracts charges up to the cap', async () => {
    mockPaymentAggregate.mockResolvedValue({
      _sum: {
        openingBalance: 100,
        januaryPayments: 600,
        februaryPayments: null,
      },
    });
    mockChargeAggregate.mockResolvedValue({ _sum: { totalAmount: 450 } });

    const total = await findDerivedClosingTotal(
      new Map([
        [2026, ['apt-1', 'apt-3']],
        [2024, ['apt-2']],
      ]),
      '202611'
    );

    expect(total.toNumber()).toBe(250);
    expect(mockPaymentAggregate.mock.calls[0][0].where).toEqual({
      OR: [
        { year: 2026, apartmentId: { in: ['apt-1', 'apt-3'] } },
        { year: 2024, apartmentId: { in: ['apt-2'] } },
      ],
    });
    expect(mockChargeAggregate.mock.calls[0][0].where).toEqual({
      OR: [
        {
          apartmentId: { in: ['apt-1', 'apt-3'] },
          period: { gte: '202601', lte: '202611' },
        },
        {
          apartmentId: { in: ['apt-2'] },
          period: { gte: '202401', lte: '202412' },
        },
      ],
    });
  });
});
