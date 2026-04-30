import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_CHARGE_TREND_PERIOD_LIMIT,
  DEFAULT_CHARGE_TREND_VIEWPORT_SIZE,
  getChargeTrendByHoaHistory,
  getPaymentMonthlyChartData,
  getRecentChargeTrendByHoa,
} from '@/components/charts/chart-data';
import { Prisma } from '@/generated/prisma/browser';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';

function makePayment(
  overrides: Partial<PaymentDtoSource> = {}
): PaymentDtoSource {
  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: new Prisma.Decimal('100.0000'),
    closingBalance: new Prisma.Decimal('0.0000'),
    openingDebt: new Prisma.Decimal('0.0000'),
    openingSurplus: new Prisma.Decimal('0.0000'),
    januaryPayments: new Prisma.Decimal('0.0000'),
    februaryPayments: new Prisma.Decimal('0.0000'),
    marchPayments: new Prisma.Decimal('0.0000'),
    aprilPayments: new Prisma.Decimal('0.0000'),
    mayPayments: new Prisma.Decimal('0.0000'),
    junePayments: new Prisma.Decimal('0.0000'),
    julyPayments: new Prisma.Decimal('0.0000'),
    augustPayments: new Prisma.Decimal('0.0000'),
    septemberPayments: new Prisma.Decimal('0.0000'),
    octoberPayments: new Prisma.Decimal('0.0000'),
    novemberPayments: new Prisma.Decimal('0.0000'),
    decemberPayments: new Prisma.Decimal('0.0000'),
    januaryCharges: new Prisma.Decimal('0.0000'),
    februaryCharges: new Prisma.Decimal('0.0000'),
    marchCharges: new Prisma.Decimal('0.0000'),
    aprilCharges: new Prisma.Decimal('0.0000'),
    mayCharges: new Prisma.Decimal('0.0000'),
    juneCharges: new Prisma.Decimal('0.0000'),
    julyCharges: new Prisma.Decimal('0.0000'),
    augustCharges: new Prisma.Decimal('0.0000'),
    septemberCharges: new Prisma.Decimal('0.0000'),
    octoberCharges: new Prisma.Decimal('0.0000'),
    novemberCharges: new Prisma.Decimal('0.0000'),
    decemberCharges: new Prisma.Decimal('0.0000'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('finance chart helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns non-empty payment months in calendar order with running balance', () => {
    const data = getPaymentMonthlyChartData(
      makePayment({
        januaryPayments: new Prisma.Decimal('50.0000'),
        januaryCharges: new Prisma.Decimal('10.0000'),
        marchCharges: new Prisma.Decimal('90.0000'),
      })
    );

    expect(data).toEqual([
      {
        monthIndex: 0,
        label: 'Styczeń',
        payments: 50,
        charges: 10,
        balance: 140,
      },
      {
        monthIndex: 2,
        label: 'Marzec',
        payments: 0,
        charges: 90,
        balance: 50,
      },
    ]);
  });

  it('keeps sub-grosz values in payment chart data', () => {
    const data = getPaymentMonthlyChartData(
      makePayment({
        aprilPayments: new Prisma.Decimal('24.9375'),
        aprilCharges: new Prisma.Decimal('149.8750'),
      })
    );

    expect(data[0]).toMatchObject({
      monthIndex: 3,
      payments: 24.9375,
      charges: 149.875,
      balance: -24.9375,
    });
  });

  it('builds full HOA history up to the current month in chronological order', () => {
    const result = getChargeTrendByHoaHistory([
      {
        homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota A' },
        charges: [
          { period: '202504', totalAmount: '999.0000' },
          { period: '202505', totalAmount: '10.0000' },
          { period: '202603', totalAmount: '30.0000' },
        ],
      },
      {
        homeownersAssociation: { id: 'hoa-2', name: 'Wspólnota B' },
        charges: [
          { period: '202506', totalAmount: '20.0000' },
          { period: '202603', totalAmount: '6.5000' },
        ],
      },
    ]);

    expect(result.series).toEqual([
      {
        key: 'hoa_hoa_1',
        label: 'Wspólnota A',
        color: 'hsl(var(--primary))',
      },
      {
        key: 'hoa_hoa_2',
        label: 'Wspólnota B',
        color: 'hsl(var(--destructive))',
      },
    ]);
    expect(result.data).toHaveLength(12);
    expect(result.data[0]).toMatchObject({ period: '202504' });
    expect(result.data[11]).toMatchObject({ period: '202603' });
    expect(
      result.data.find((entry) => entry.period === '202603')
    ).toMatchObject({
      hoa_hoa_1: 30,
      hoa_hoa_2: 6.5,
    });
  });

  it('ignores zero-value charges and omits empty HOA series', () => {
    const result = getRecentChargeTrendByHoa(
      [
        {
          homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota A' },
          charges: [
            { period: '202602', totalAmount: '0.0000' },
            { period: '202603', totalAmount: '12.3400' },
          ],
        },
        {
          homeownersAssociation: { id: 'hoa-2', name: 'Wspólnota B' },
          charges: [{ period: '202603', totalAmount: '0.0000' }],
        },
      ],
      '202603'
    );

    expect(result.series).toEqual([
      {
        key: 'hoa_hoa_1',
        label: 'Wspólnota A',
        color: 'hsl(var(--primary))',
      },
    ]);
    expect(
      result.data.find((entry) => entry.period === '202603')
    ).toMatchObject({
      hoa_hoa_1: 12.34,
    });
  });

  it('keeps the default viewport size at 12 months', () => {
    expect(DEFAULT_CHARGE_TREND_VIEWPORT_SIZE).toBe(12);
    expect(DEFAULT_CHARGE_TREND_PERIOD_LIMIT).toBe(12);
  });
});
