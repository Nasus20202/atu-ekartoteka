import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import type { Payment } from '@/lib/types';
import {
  CHARGE_MONTH_FIELD_KEYS,
  getNonEmptyMonths,
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
});
