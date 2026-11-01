import { describe, expect, it } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import {
  getPaymentSummary,
  parsePaymentYear,
} from '@/app/dashboard/payments/[apartmentId]/[year]/payment-summary';
import { Prisma } from '@/generated/prisma/browser';

describe('parsePaymentYear', () => {
  it('parses a year within the supported range', () => {
    expect(parsePaymentYear('2025')).toBe(2025);
    expect(parsePaymentYear('1900')).toBe(1900);
    expect(parsePaymentYear('2100')).toBe(2100);
  });

  it.each(['abc', '1899', '2101'])('rejects %s', (year) => {
    expect(parsePaymentYear(year)).toBeNull();
  });
});

describe('getPaymentSummary', () => {
  it('sums monthly payments and charges and keeps the balances', () => {
    const summary = getPaymentSummary(
      createMockPayment({
        januaryPayments: new Prisma.Decimal('100.5'),
        decemberPayments: new Prisma.Decimal('20'),
        calculatedMarchCharges: new Prisma.Decimal('42.0725'),
        openingBalance: new Prisma.Decimal(-5),
        calculatedClosingBalance: new Prisma.Decimal(73),
      })
    );

    expect(summary.totalPayments.toString()).toBe('120.5');
    expect(summary.totalCharges.toString()).toBe('42.0725');
    expect(summary.openingBalance.toString()).toBe('-5');
    expect(summary.closingBalance.toString()).toBe('73');
  });
});
