import { describe, expect, it } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import { Prisma } from '@/generated/prisma/browser';
import type { Payment } from '@/lib/types';
import {
  getNonEmptyMonths,
  getPaymentTotals,
} from '@/lib/utils/payment-months';

describe('getNonEmptyMonths', () => {
  it('returns empty array for all-zero year', () => {
    expect(getNonEmptyMonths(createMockPayment())).toEqual([]);
  });

  it('returns only non-empty months in order', () => {
    const payment = createMockPayment({
      januaryPayments: new Prisma.Decimal('100.0000'),
      marchCharges: new Prisma.Decimal('50.0000'),
    });

    expect(getNonEmptyMonths(payment).map((month) => month.monthIndex)).toEqual(
      [0, 2]
    );
  });

  it('preserves sub-grosz values', () => {
    const payment = createMockPayment({
      aprilCharges: new Prisma.Decimal('42.0725'),
    });

    expect(getNonEmptyMonths(payment)[0].charges.toFixed(4)).toBe('42.0725');
  });

  it('treats Decimal 0.0000 as zero', () => {
    const payment = createMockPayment({
      januaryPayments: new Prisma.Decimal('0.0000'),
      januaryCharges: new Prisma.Decimal('0.0000'),
      februaryPayments: new Prisma.Decimal('0.0001'),
    });

    expect(getNonEmptyMonths(payment).map((month) => month.monthIndex)).toEqual(
      [1]
    );
  });

  it('treats payments without a year as year 0 when filtering by period', () => {
    const withoutYear: Omit<Payment, 'year'> & { year?: number } =
      createMockPayment({
        januaryPayments: new Prisma.Decimal(1),
      });
    delete withoutYear.year;

    expect(getNonEmptyMonths(withoutYear, '001')).toHaveLength(1);
    expect(getNonEmptyMonths(withoutYear, '000')).toEqual([]);
  });

  describe('with maxPeriod', () => {
    it('filters out months after maxPeriod', () => {
      const payment = createMockPayment({
        year: 2024,
        marchPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
        novemberPayments: new Prisma.Decimal('300'),
      });

      const result = getNonEmptyMonths(payment, '202405');

      expect(result.map((m) => m.monthIndex)).toEqual([2]);
    });

    it('shows all months when maxPeriod is null', () => {
      const payment = createMockPayment({
        year: 2024,
        januaryPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
      });

      const result = getNonEmptyMonths(payment, null);

      expect(result.map((m) => m.monthIndex)).toEqual([0, 5]);
    });

    it('shows all months when maxPeriod is undefined', () => {
      const payment = createMockPayment({
        year: 2024,
        januaryPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
      });

      const result = getNonEmptyMonths(payment);

      expect(result.map((m) => m.monthIndex)).toEqual([0, 5]);
    });

    it('includes the boundary month', () => {
      const payment = createMockPayment({
        year: 2024,
        mayPayments: new Prisma.Decimal('100'),
        junePayments: new Prisma.Decimal('200'),
      });

      const result = getNonEmptyMonths(payment, '202405');

      expect(result.map((m) => m.monthIndex)).toEqual([4]);
    });
  });
});

describe('getPaymentTotals', () => {
  it('returns zero totals for an all-zero record', () => {
    const totals = getPaymentTotals(createMockPayment());

    expect(totals.yearPayments.toFixed(2)).toBe('0.00');
    expect(totals.yearCharges.toFixed(2)).toBe('0.00');
    expect(totals.totalPayments.toFixed(2)).toBe('0.00');
    expect(totals.totalCharges.toFixed(2)).toBe('0.00');
  });

  it('adds the opening surplus to the payments total only', () => {
    const totals = getPaymentTotals(
      createMockPayment({
        openingSurplus: new Prisma.Decimal('80.65'),
        januaryPayments: new Prisma.Decimal('800.00'),
        januaryCharges: new Prisma.Decimal('889.20'),
      })
    );

    expect(totals.yearPayments.toFixed(2)).toBe('800.00');
    expect(totals.totalPayments.toFixed(2)).toBe('880.65');
    expect(totals.yearCharges.toFixed(2)).toBe('889.20');
    expect(totals.totalCharges.toFixed(2)).toBe('889.20');
  });

  it('adds the opening debt to the charges total only', () => {
    const totals = getPaymentTotals(
      createMockPayment({
        openingDebt: new Prisma.Decimal('120.00'),
        marchCharges: new Prisma.Decimal('1000.00'),
      })
    );

    expect(totals.yearCharges.toFixed(2)).toBe('1000.00');
    expect(totals.totalCharges.toFixed(2)).toBe('1120.00');
    expect(totals.totalPayments.toFixed(2)).toBe('0.00');
  });

  it('makes the totals add up to the closing balance', () => {
    const payment = createMockPayment({
      openingSurplus: new Prisma.Decimal('80.65'),
      januaryPayments: new Prisma.Decimal('800.00'),
      januaryCharges: new Prisma.Decimal('889.20'),
      octoberCharges: new Prisma.Decimal('945.78'),
      closingBalance: new Prisma.Decimal('-954.33'),
    });
    const totals = getPaymentTotals(payment);

    expect(totals.totalPayments.minus(totals.totalCharges).toFixed(2)).toBe(
      payment.closingBalance.toFixed(2)
    );
  });
});
