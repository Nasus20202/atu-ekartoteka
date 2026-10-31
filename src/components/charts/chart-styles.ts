import { CHART_COLORS } from '@/components/charts/chart-colors';

const TOOLTIP_BORDER_RADIUS = 12;

export const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: CHART_COLORS.tooltip,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: TOOLTIP_BORDER_RADIUS,
  whiteSpace: 'normal' as const,
};

const TOOLTIP_Z_INDEX = 10;

export const TOOLTIP_WRAPPER_STYLE = {
  maxWidth: '100%',
  zIndex: TOOLTIP_Z_INDEX,
};

const COMPACT_CHART_MAX_WIDTH = 480;

// On narrow charts the tooltip is wider than the plot area, so Recharts cannot
// keep it inside; pin it to the left edge where it can use the full width.
export function getTooltipPosition(chartWidth: number) {
  return chartWidth <= COMPACT_CHART_MAX_WIDTH ? { x: 0 } : undefined;
}

export const ZERO_LINE_PROPS = {
  y: 0,
  stroke: CHART_COLORS.zeroLine,
  strokeWidth: 1,
};
