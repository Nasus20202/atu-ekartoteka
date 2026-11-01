import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import {
  applyDerivedFigures,
  computePaymentFigures,
} from '@/lib/utils/payment-balances';

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

function makePayment(openingBalance: number, payments: number[] = []) {
  return {
    year: 2025,
    openingBalance,
    ...Object.fromEntries(
      MONTHS.map((month, index) => [`${month}Payments`, payments[index] ?? 0])
    ),
  } as Parameters<typeof computePaymentFigures>[0];
}

function sums(entries: Record<string, number>) {
  return new Map(
    Object.entries(entries).map(([period, amount]) => [
      period,
      new Prisma.Decimal(amount),
    ])
  );
}

describe('computePaymentFigures', () => {
  it('sums charge records per month, including settlement lines', () => {
    const figures = computePaymentFigures(
      makePayment(0),
      sums({ '202504': 420, '202501': 500 }),
      '202512'
    );

    expect(figures.monthlyCharges[0].toNumber()).toBe(500);
    expect(figures.monthlyCharges[3].toNumber()).toBe(420);
    expect(figures.monthlyCharges[1].toNumber()).toBe(0);
  });

  it('derives the closing balance from opening balance, payments and charges', () => {
    const figures = computePaymentFigures(
      makePayment(100, [600, 600]),
      sums({ '202501': 750, '202502': 750 }),
      '202512'
    );

    expect(figures.closingBalance.toNumber()).toBe(-200);
  });

  it('builds the running balance month by month', () => {
    const figures = computePaymentFigures(
      makePayment(100, [0, 300]),
      sums({ '202501': 150, '202502': 150 }),
      '202512'
    );

    expect(figures.monthlyBalances.slice(0, 3).map(Number)).toEqual([
      -50, 100, 100,
    ]);
  });

  it('ignores charges after the maximum period', () => {
    const figures = computePaymentFigures(
      makePayment(0),
      sums({ '202503': 100, '202504': 100 }),
      '202503'
    );

    expect(figures.monthlyCharges[3].toNumber()).toBe(0);
    expect(figures.closingBalance.toNumber()).toBe(-100);
  });

  it('keeps the opening balance without any charges', () => {
    const figures = computePaymentFigures(makePayment(42), undefined, '202512');

    expect(figures.closingBalance.toNumber()).toBe(42);
    expect(
      figures.monthlyBalances.every((value) => value.toNumber() === 42)
    ).toBe(true);
  });
});

describe('applyDerivedFigures', () => {
  it('replaces legacy values with derived figures and keeps the rest', () => {
    const payment = {
      ...makePayment(10, [100]),
      id: 'p1',
      legacyClosingBalance: 999,
      legacyJanuaryCharges: 1,
      legacyDecemberCharges: 2,
    };

    const derived = applyDerivedFigures(
      payment,
      sums({ '202501': 30 }),
      '202512'
    );

    expect(derived.calculatedJanuaryCharges.toNumber()).toBe(30);
    expect(derived.calculatedClosingBalance.toNumber()).toBe(80);
    expect(derived.openingBalance).toBe(10);
    expect(derived.id).toBe('p1');
    expect(derived).not.toHaveProperty('legacyClosingBalance');
    expect(derived).not.toHaveProperty('legacyJanuaryCharges');
    expect(derived).not.toHaveProperty('legacyDecemberCharges');
  });

  it('does not chain years: each starts from its own opening balance', () => {
    const second = { ...makePayment(500), year: 2026 };

    const derived = applyDerivedFigures(second, undefined, '202612');

    expect(derived.calculatedClosingBalance.toNumber()).toBe(500);
  });
});
