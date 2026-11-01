import { describe, expect, it } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import { getSeriesColor } from '@/components/charts/chart-colors';
import {
  getChargeTrendByApartment,
  getPaymentMonthlyChartData,
} from '@/components/charts/chart-data';
import { Prisma } from '@/generated/prisma/browser';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';

const makePayment = (overrides: Partial<PaymentDtoSource> = {}) =>
  createMockPayment({ openingBalance: new Prisma.Decimal(100), ...overrides });

describe('finance chart helpers', () => {
  it('returns non-empty payment months in calendar order with running balance', () => {
    const data = getPaymentMonthlyChartData(
      makePayment({
        januaryPayments: new Prisma.Decimal('50.0000'),
        calculatedJanuaryCharges: new Prisma.Decimal('10.0000'),
        calculatedMarchCharges: new Prisma.Decimal('90.0000'),
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
        calculatedAprilCharges: new Prisma.Decimal('149.8750'),
      })
    );

    expect(data[0]).toMatchObject({
      monthIndex: 3,
      payments: 24.9375,
      charges: 149.875,
      balance: -24.9375,
    });
  });

  it('builds full apartment history up to the end period in chronological order', () => {
    const result = getChargeTrendByApartment(
      [
        {
          id: 'apt-1',
          address: 'Testowa',
          building: '1',
          number: '1',
          charges: [
            { period: '202504', totalAmount: '999.0000' },
            { period: '202505', totalAmount: '10.0000' },
            { period: '202603', totalAmount: '30.0000' },
          ],
        },
        {
          id: 'apt-2',
          address: 'Testowa',
          building: '1',
          number: '2',
          charges: [
            { period: '202506', totalAmount: '20.0000' },
            { period: '202603', totalAmount: '6.5000' },
          ],
        },
      ],
      '202603'
    );

    expect(result.series).toEqual([
      {
        key: 'apt_apt_1',
        label: 'Testowa 1/1',
        color: 'hsl(var(--primary))',
        apartmentId: 'apt-1',
      },
      {
        key: 'apt_apt_2',
        label: 'Testowa 1/2',
        color: 'hsl(var(--destructive))',
        apartmentId: 'apt-2',
      },
    ]);
    expect(result.data).toHaveLength(12);
    expect(result.data[0]).toMatchObject({ period: '202504' });
    expect(result.data[11]).toMatchObject({ period: '202603' });
    expect(
      result.data.find((entry) => entry.period === '202603')
    ).toMatchObject({
      apt_apt_1: 30,
      apt_apt_2: 6.5,
    });
  });

  it('ignores zero-value charges and omits empty apartment series', () => {
    const result = getChargeTrendByApartment(
      [
        {
          id: 'apt-1',
          address: 'Testowa',
          building: '1',
          number: '1',
          charges: [
            { period: '202602', totalAmount: '0.0000' },
            { period: '202603', totalAmount: '12.3400' },
          ],
        },
        {
          id: 'apt-2',
          address: 'Testowa',
          building: '1',
          number: '2',
          charges: [{ period: '202603', totalAmount: '0.0000' }],
        },
      ],
      '202603'
    );

    expect(result.series).toEqual([
      {
        key: 'apt_apt_1',
        label: 'Testowa 1/1',
        color: 'hsl(var(--primary))',
        apartmentId: 'apt-1',
      },
    ]);
    expect(
      result.data.find((entry) => entry.period === '202603')
    ).toMatchObject({
      apt_apt_1: 12.34,
    });
  });

  it('returns no data without charges', () => {
    expect(
      getChargeTrendByApartment(
        [
          {
            id: 'apt-1',
            address: 'Testowa',
            building: '1',
            number: '1',
            charges: [],
          },
        ],
        '202603'
      )
    ).toEqual({ data: [], series: [] });
  });

  it('keeps input order and colors by position among all apartments', () => {
    const result = getChargeTrendByApartment(
      [
        {
          id: 'apt-0',
          address: 'Pusta',
          building: '',
          number: '0',
          charges: [],
        },
        {
          id: 'apt-2',
          address: 'Zielona',
          building: '',
          number: '2',
          charges: [{ period: '202603', totalAmount: '1.0000' }],
        },
        {
          id: 'apt-1',
          address: 'Akacjowa',
          building: '',
          number: '1',
          charges: [{ period: '202603', totalAmount: '1.0000' }],
        },
      ],
      '202603'
    );

    expect(result.series.map((entry) => entry.label)).toEqual([
      'Zielona /2',
      'Akacjowa /1',
    ]);
    expect(result.series.map((entry) => entry.color)).toEqual([
      getSeriesColor(1),
      getSeriesColor(2),
    ]);
  });
});
