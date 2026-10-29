import { describe, expect, it } from 'vitest';

import {
  getBalanceStatusClass,
  getSignedBalanceClass,
} from '@/lib/utils/balance-class';

describe('getSignedBalanceClass', () => {
  it('colours by sign and leaves zero uncoloured', () => {
    expect(getSignedBalanceClass(-1)).toBe('text-red-600');
    expect(getSignedBalanceClass(0)).toBe('');
    expect(getSignedBalanceClass(1)).toBe('text-green-600');
  });
});

describe('getBalanceStatusClass', () => {
  it('colours a non-negative balance green', () => {
    expect(getBalanceStatusClass(-1)).toBe('text-red-600');
    expect(getBalanceStatusClass(0)).toBe('text-green-600');
    expect(getBalanceStatusClass('1')).toBe('text-green-600');
  });
});
