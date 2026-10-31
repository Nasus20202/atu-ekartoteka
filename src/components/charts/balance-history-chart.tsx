'use client';

import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { BalanceTrend } from '@/components/charts/balance-history-data';
import { CHART_COLORS } from '@/components/charts/chart-colors';
import {
  formatSeriesTooltipAmount,
  formatTooltipLabel,
} from '@/components/charts/chart-formatters';
import {
  getTooltipPosition,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_WRAPPER_STYLE,
  ZERO_LINE_PROPS,
} from '@/components/charts/chart-styles';
import {
  COMPACT_Y_AXIS_WIDTH,
  renderCompactYAxisTick,
} from '@/components/charts/chart-ticks';
import {
  ChartViewportNav,
  useChartViewport,
} from '@/components/charts/chart-viewport';
import { MeasuredChart } from '@/components/charts/measured-chart';
import { getPaymentYearHref } from '@/lib/utils/dashboard-links';
import { getPeriodYear } from '@/lib/utils/group-by-year';

const BAR_RADIUS = 4;
const MAX_BAR_SIZE = 24;
const CLICKABLE_CLASS = 'cursor-pointer';

function getSignColor(value: number | undefined): string {
  return (value ?? 0) < 0
    ? CHART_COLORS.balanceNegative
    : CHART_COLORS.balancePositive;
}

// A single apartment is colored by balance sign; several apartments are
// colored per apartment, like the charge trend chart.
export function BalanceHistoryChart({ data, series }: BalanceTrend) {
  const viewport = useChartViewport(data);
  const { visibleData } = viewport;
  const isSingleSeries = series.length === 1;
  const router = useRouter();

  const openPaymentYear =
    (apartmentId: string) => (bar: { payload?: { period?: string } }) => {
      const period = bar.payload?.period;

      if (period) {
        router.push(getPaymentYearHref(apartmentId, getPeriodYear(period)));
      }
    };

  if (series.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="balance-history-chart">
      <ChartViewportNav
        firstLabel={visibleData[0]?.label}
        lastLabel={visibleData.at(-1)?.label}
        canGoBack={viewport.canGoBack}
        canGoForward={viewport.canGoForward}
        onBack={viewport.goBack}
        onForward={viewport.goForward}
      />
      <MeasuredChart className="h-56 w-full">
        {({ width, height }) => (
          <BarChart
            width={width}
            height={height}
            data={visibleData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke={CHART_COLORS.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              width={COMPACT_Y_AXIS_WIDTH}
              tick={renderCompactYAxisTick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: CHART_COLORS.grid, fillOpacity: 0.3 }}
              formatter={formatSeriesTooltipAmount}
              labelFormatter={formatTooltipLabel}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              position={getTooltipPosition(width)}
              wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            />
            <ReferenceLine {...ZERO_LINE_PROPS} ifOverflow="extendDomain" />
            {isSingleSeries ? (
              <Bar
                dataKey={series[0].key}
                className={CLICKABLE_CLASS}
                onClick={openPaymentYear(series[0].apartmentId)}
                name={series[0].label}
                radius={BAR_RADIUS}
                maxBarSize={MAX_BAR_SIZE}
              >
                {visibleData.map((datum) => (
                  <Cell
                    key={datum.period}
                    fill={getSignColor(datum[series[0].key])}
                  />
                ))}
              </Bar>
            ) : (
              series.map((entry) => (
                <Bar
                  key={entry.key}
                  dataKey={entry.key}
                  className={CLICKABLE_CLASS}
                  onClick={openPaymentYear(entry.apartmentId)}
                  name={entry.label}
                  fill={entry.color}
                  radius={BAR_RADIUS}
                  maxBarSize={MAX_BAR_SIZE}
                />
              ))
            )}
            {!isSingleSeries && <Legend />}
          </BarChart>
        )}
      </MeasuredChart>
    </div>
  );
}
