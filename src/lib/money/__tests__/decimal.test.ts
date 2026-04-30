import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import { isZeroAmount, toDecimal } from '@/lib/money/decimal';

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
