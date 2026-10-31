import { describe, expect, it } from 'vitest';

import { getTooltipPosition } from '@/components/charts/chart-styles';

describe('getTooltipPosition', () => {
  it('pins the tooltip to the left edge on narrow charts', () => {
    expect(getTooltipPosition(288)).toEqual({ x: 0 });
    expect(getTooltipPosition(480)).toEqual({ x: 0 });
  });

  it('lets the tooltip follow the cursor on wide charts', () => {
    expect(getTooltipPosition(481)).toBeUndefined();
  });
});
