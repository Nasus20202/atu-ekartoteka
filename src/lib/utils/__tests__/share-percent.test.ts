import { describe, expect, it } from 'vitest';

import { formatSharePercent } from '@/lib/utils';

describe('formatSharePercent', () => {
  it('formats the ratio as a Polish percentage without trailing zeros', () => {
    expect(formatSharePercent(0.0575)).toBe('5,75%');
    expect(formatSharePercent(0.5)).toBe('50%');
    expect(formatSharePercent(0.0505)).toBe('5,05%');
  });

  it('keeps up to four decimal places', () => {
    expect(formatSharePercent(1 / 3)).toBe('33,3333%');
  });

  it('does not group thousands', () => {
    expect(formatSharePercent(123.4567)).toBe('12345,67%');
  });

  it('shows a zero share as 0%', () => {
    expect(formatSharePercent(0)).toBe('0%');
  });

  it('returns null for an unknown share', () => {
    expect(formatSharePercent(null)).toBeNull();
  });
});
