import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import {
  DB_DECIMAL_SCALE,
  decimalEqualsStored,
  isZeroAmount,
  toDecimal,
} from '@/lib/utils/decimal';

describe('decimal helpers', () => {
  it('normalizes numbers', () => {
    expect(toDecimal(12.34).toFixed(2)).toBe('12.34');
  });

  it('normalizes strings', () => {
    expect(toDecimal('12.3400').toFixed(4)).toBe('12.3400');
  });

  it('returns existing decimals unchanged', () => {
    const decimal = new Prisma.Decimal('12.3400');

    expect(toDecimal(decimal)).toBe(decimal);
  });

  it('round-trips 4 fractional digits', () => {
    expect(toDecimal('100.0725').toFixed(4)).toBe('100.0725');
  });

  it('detects zero values', () => {
    expect(isZeroAmount(new Prisma.Decimal('0.0000'))).toBe(true);
    expect(isZeroAmount('0')).toBe(true);
    expect(isZeroAmount(0)).toBe(true);
    expect(isZeroAmount('0.0001')).toBe(false);
  });
});

describe('decimalEqualsStored', () => {
  it('matches the schema column scale', () => {
    expect(DB_DECIMAL_SCALE).toBe(4);
  });

  it('treats equal values as equal', () => {
    expect(decimalEqualsStored('12.3400', '12.34')).toBe(true);
  });

  it('ignores digits beyond the stored scale', () => {
    expect(decimalEqualsStored('-132.5805', '-132.580542')).toBe(true);
  });

  it('rounds half away from zero like PostgreSQL', () => {
    expect(decimalEqualsStored('10.1237', '10.123650')).toBe(true);
    expect(decimalEqualsStored('-10.1237', '-10.123650')).toBe(true);
  });

  it('detects changes visible at the stored scale', () => {
    expect(decimalEqualsStored('10.1234', '10.1236')).toBe(false);
  });

  it('accepts Prisma Decimal, string and number inputs', () => {
    expect(
      decimalEqualsStored(
        new Prisma.Decimal('1.2345'),
        new Prisma.Decimal('1.23454')
      )
    ).toBe(true);
    expect(decimalEqualsStored('1.5', 1.50001)).toBe(true);
    expect(decimalEqualsStored(2, '2.00004')).toBe(true);
  });
});
