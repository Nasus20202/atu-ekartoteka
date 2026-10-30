import { CHART_COLORS } from '@/components/charts/chart-colors';

const TOOLTIP_BORDER_RADIUS = 12;

export const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: CHART_COLORS.tooltip,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: TOOLTIP_BORDER_RADIUS,
};

export const ZERO_LINE_PROPS = {
  y: 0,
  stroke: CHART_COLORS.zeroLine,
  strokeWidth: 1,
};
