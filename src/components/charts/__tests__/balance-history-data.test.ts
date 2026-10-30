import { describe, expect, it } from 'vitest';

import {
  getBalanceHistory,
  mergeBalanceHistories,
} from '@/components/charts/balance-history-data';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';

type MonthAmounts = Partial<Record<number, [number, number]>>;
type PaymentSource = Parameters<typeof getBalanceHistory>[0][number];

function payment(
  year: number,
  openingBalance: number,
  months: MonthAmounts
): PaymentSource {
  const fields: Record<string, number> = {};

  PAYMENT_MONTH_FIELD_KEYS.forEach((key, monthIndex) => {
    fields[key] = months[monthIndex]?.[0] ?? 0;
    fields[CHARGE_MONTH_FIELD_KEYS[monthIndex]] = months[monthIndex]?.[1] ?? 0;
  });

  return { ...fields, year, openingBalance } as PaymentSource;
}

describe('getBalanceHistory', () => {
  it('returns an empty list without payment data', () => {
    expect(getBalanceHistory([], '202503')).toEqual([]);
  });

  it('accumulates monthly balance from the opening balance', () => {
    expect(
      getBalanceHistory(
        [payment(2025, 50, { 0: [100, 120], 1: [0, 80] })],
        '202502'
      )
    ).toEqual([
      { period: '202501', label: 'Styczeń 2025', balance: 30 },
      { period: '202502', label: 'Luty 2025', balance: -50 },
    ]);
  });

  it('carries the last balance through empty months up to the end period', () => {
    const history = getBalanceHistory(
      [payment(2025, 0, { 0: [10, 0] })],
      '202503'
    );

    expect(history.map((datum) => datum.balance)).toEqual([10, 10, 10]);
  });

  it('restarts from each year opening balance across years', () => {
    expect(
      getBalanceHistory(
        [payment(2026, -20, { 0: [0, 10] }), payment(2025, 0, { 11: [0, 20] })],
        '202601'
      )
    ).toEqual([
      { period: '202512', label: 'Grudzień 2025', balance: -20 },
      { period: '202601', label: 'Styczeń 2026', balance: -30 },
    ]);
  });

  it('ignores months after the end period', () => {
    const history = getBalanceHistory(
      [payment(2025, 0, { 0: [10, 0], 5: [0, 999] })],
      '202502'
    );

    expect(history.map((datum) => datum.period)).toEqual(['202501', '202502']);
  });
});

describe('mergeBalanceHistories', () => {
  const datum = (period: string, label: string, balance: number) => ({
    period,
    label,
    balance,
  });

  it('returns empty trend without any history', () => {
    expect(
      mergeBalanceHistories([
        {
          apartmentId: 'apt-1',
          label: 'Testowa 1/1',
          color: 'red',
          history: [],
        },
      ])
    ).toEqual({ data: [], series: [] });
  });

  it('combines apartments into one series each over the shared period range', () => {
    const trend = mergeBalanceHistories([
      {
        apartmentId: 'apt-1',
        label: 'Testowa 1/1',
        color: 'red',
        history: [
          datum('202501', 'Styczeń 2025', 10),
          datum('202502', 'Luty 2025', -5),
        ],
      },
      {
        apartmentId: 'apt-2',
        label: 'Testowa 1/2',
        color: 'green',
        history: [],
      },
      {
        apartmentId: 'apt-3',
        label: 'Testowa 1/3',
        color: 'blue',
        history: [datum('202502', 'Luty 2025', 30)],
      },
    ]);

    expect(
      trend.series.map((entry) => [entry.key, entry.label, entry.apartmentId])
    ).toEqual([
      ['apt_0', 'Testowa 1/1', 'apt-1'],
      ['apt_1', 'Testowa 1/3', 'apt-3'],
    ]);
    expect(trend.series.map((entry) => entry.color)).toEqual(['red', 'blue']);
    expect(trend.data).toEqual([
      { period: '202501', label: 'Styczeń 2025', apt_0: 10 },
      { period: '202502', label: 'Luty 2025', apt_0: -5, apt_1: 30 },
    ]);
  });
});
