import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats numbers', () => {
    expect(formatCurrency(123.45)).toBe('123,45 zł');
  });

  it('formats strings', () => {
    expect(formatCurrency('123.45')).toBe('123,45 zł');
  });

  it('formats Prisma decimals', () => {
    expect(formatCurrency(new Prisma.Decimal('123.4500'))).toBe('123,45 zł');
  });
});
