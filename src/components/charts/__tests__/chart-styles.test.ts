import { describe, expect, it } from 'vitest';

import {
  getTooltipPosition,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_TEXT_STYLE,
} from '@/components/charts/chart-styles';

describe('getTooltipPosition', () => {
  it('pins the tooltip to the left edge on narrow charts', () => {
    expect(getTooltipPosition(288)).toEqual({ x: 0 });
    expect(getTooltipPosition(480)).toEqual({ x: 0 });
  });

  it('lets the tooltip follow the cursor on wide charts', () => {
    expect(getTooltipPosition(481)).toBeUndefined();
  });
});

describe('tooltip text colour', () => {
  it('follows the theme foreground instead of a fixed colour', () => {
    expect(TOOLTIP_TEXT_STYLE.color).toBe('hsl(var(--foreground))');
    expect(TOOLTIP_CONTENT_STYLE.color).toBe(TOOLTIP_TEXT_STYLE.color);
  });
});
