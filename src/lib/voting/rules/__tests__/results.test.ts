import { describe, expect, it } from 'vitest';

import { choicePercent } from '@/lib/voting/rules/results';

describe('choicePercent', () => {
  it('rounds to a whole percent', () => {
    expect(choicePercent(1, 3)).toBe(33);
    expect(choicePercent(2, 3)).toBe(67);
    expect(choicePercent(4, 4)).toBe(100);
  });

  it('is zero when nobody voted', () => {
    expect(choicePercent(0, 0)).toBe(0);
  });
});
