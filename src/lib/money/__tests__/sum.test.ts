import { describe, expect, it } from 'vitest';

import { sumDecimals } from '@/lib/money/sum';

describe('sumDecimals', () => {
  it('returns zero for empty arrays', () => {
    expect(sumDecimals([]).toFixed(4)).toBe('0.0000');
  });

  it('supports mixed input forms', () => {
    expect(sumDecimals([1.25, '2.5000', 3]).toFixed(4)).toBe('6.7500');
  });

  it('preserves decimal precision where native floats drift', () => {
    expect(sumDecimals(['0.1', '0.2', '0.3']).toFixed(1)).toBe('0.6');
  });
});
