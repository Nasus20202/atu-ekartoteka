import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import type { Payment } from '@/lib/types';
import {
  CHARGE_MONTH_FIELD_KEYS,
  dateToPeriod,
  getNonEmptyMonths,
  isPeriodAfterDate,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';

function makePayment(overrides: Partial<Payment> = {}): Payment {
  const base = {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: new Prisma.Decimal(0),
    closingBalance: new Prisma.Decimal(0),
    openingDebt: new Prisma.Decimal(0),
    openingSurplus: new Prisma.Decimal(0),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Payment;

  for (const key of PAYMENT_MONTH_FIELD_KEYS) {
    base[key] = new Prisma.Decimal(0);
  }

  for (const key of CHARGE_MONTH_FIELD_KEYS) {
    base[key] = new Prisma.Decimal(0);
  }

  return { ...base, ...overrides };
}

describe('getNonEmptyMonths', () => {
  it('returns empty array for all-zero year', () => {
    expect(getNonEmptyMonths(makePayment())).toEqual([]);
  });

  it('returns only non-empty months in order', () => {
    const payment = makePayment({
      januaryPayments: new Prisma.Decimal('100.0000'),
      marchCharges: new Prisma.Decimal('50.0000'),
    });

    expect(getNonEmptyMonths(payment).map((month) => month.monthIndex)).toEqual(
      [0, 2]
    );
  });

  it('preserves sub-grosz values', () => {
    const payment = makePayment({
      aprilCharges: new Prisma.Decimal('42.0725'),
    });

    expect(getNonEmptyMonths(payment)[0].charges.toFixed(4)).toBe('42.0725');
  });

  it('treats Decimal 0.0000 as zero', () => {
    const payment = makePayment({
      januaryPayments: new Prisma.Decimal('0.0000'),
      januaryCharges: new Prisma.Decimal('0.0000'),
      februaryPayments: new Prisma.Decimal('0.0001'),
    });

    expect(getNonEmptyMonths(payment).map((month) => month.monthIndex)).toEqual(
      [1]
    );
  });

  describe('with maxPeriod', () => {
    it('filters out months after maxPeriod', () => {
      const payment = makePayment({
        year: 2024,
        marchPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
        novemberPayments: new Prisma.Decimal('300'),
      });

      const result = getNonEmptyMonths(payment, '202405');

      expect(result.map((m) => m.monthIndex)).toEqual([2]);
    });

    it('shows all months when maxPeriod is null', () => {
      const payment = makePayment({
        year: 2024,
        januaryPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
      });

      const result = getNonEmptyMonths(payment, null);

      expect(result.map((m) => m.monthIndex)).toEqual([0, 5]);
    });

    it('shows all months when maxPeriod is undefined', () => {
      const payment = makePayment({
        year: 2024,
        januaryPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
      });

      const result = getNonEmptyMonths(payment);

      expect(result.map((m) => m.monthIndex)).toEqual([0, 5]);
    });

    it('includes the boundary month', () => {
      const payment = makePayment({
        year: 2024,
        mayPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
      });

      const result = getNonEmptyMonths(payment, '202405');

      expect(result.map((m) => m.monthIndex)).toEqual([4]);
    });
  });
});

describe('dateToPeriod', () => {
  it('converts a Date to YYYYMM format', () => {
    expect(dateToPeriod(new Date('2026-05-31'))).toBe('202605');
  });

  it('pads single-digit months', () => {
    expect(dateToPeriod(new Date('2026-01-15'))).toBe('202601');
  });

  it('handles December correctly', () => {
    expect(dateToPeriod(new Date('2025-12-01'))).toBe('202512');
  });
});

describe('isPeriodAfterDate', () => {
  it('returns true when period is after the date', () => {
    expect(isPeriodAfterDate('202606', '2026-05-31')).toBe(true);
  });

  it('returns false when period is before the date', () => {
    expect(isPeriodAfterDate('202604', '2026-05-31')).toBe(false);
  });

  it('returns false when period equals the date period', () => {
    expect(isPeriodAfterDate('202605', '2026-05-31')).toBe(false);
  });

  it('returns false when dateStr is null', () => {
    expect(isPeriodAfterDate('202606', null)).toBe(false);
  });
});
