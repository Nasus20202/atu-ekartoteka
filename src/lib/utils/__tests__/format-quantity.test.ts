import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import { formatQuantity } from '@/lib/utils';

describe('formatQuantity', () => {
  it('uses a Polish decimal comma', () => {
    expect(formatQuantity('50.5')).toBe('50,5');
    expect(formatQuantity(new Prisma.Decimal('0.125'))).toBe('0,125');
  });

  it('keeps whole numbers and full precision', () => {
    expect(formatQuantity(3)).toBe('3');
    expect(formatQuantity('12.3456789')).toBe('12,3456789');
  });
});
