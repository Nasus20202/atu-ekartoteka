import type { YAxisTickContentProps } from 'recharts';

import { CHART_COLORS } from '@/components/charts/chart-colors';

const ZERO_TICK_FONT_WEIGHT = 700;
const DEFAULT_TICK_FONT_WEIGHT = 400;
const TICK_BASELINE_OFFSET = 4;

export function createYAxisTick(
  formatValue: (value: number) => string,
  fontSize: number
) {
  return function YAxisTick({
    x,
    y,
    textAnchor,
    payload,
  }: YAxisTickContentProps) {
    const value = Number(payload.value);

    return (
      <text
        x={x}
        y={y}
        dy={TICK_BASELINE_OFFSET}
        textAnchor={textAnchor}
        fill={CHART_COLORS.muted}
        fontSize={fontSize}
        fontWeight={
          value === 0 ? ZERO_TICK_FONT_WEIGHT : DEFAULT_TICK_FONT_WEIGHT
        }
      >
        {formatValue(value)}
      </text>
    );
  };
}
