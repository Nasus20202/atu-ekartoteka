'use client';

import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  type MouseHandlerDataParam,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_COLORS } from '@/components/charts/chart-colors';
import type {
  ChargeTrendDatum,
  ChargeTrendSeries,
} from '@/components/charts/chart-data';
import {
  formatCompactAmount,
  formatSeriesTooltipAmount,
  formatTooltipLabel,
} from '@/components/charts/chart-formatters';
import { createYAxisTick } from '@/components/charts/chart-ticks';
import {
  ChartViewportNav,
  useChartViewport,
} from '@/components/charts/chart-viewport';
import { MeasuredChart } from '@/components/charts/measured-chart';
import { getChargesHref } from '@/lib/utils/dashboard-links';

const Y_AXIS_FONT_SIZE = 11;
const Y_AXIS_WIDTH = 72;

const renderYAxisTick = createYAxisTick(formatCompactAmount, Y_AXIS_FONT_SIZE);

interface ChargeTrendChartProps {
  data: ChargeTrendDatum[];
  series: ChargeTrendSeries[];
}

export function ChargeTrendChart({ data, series }: ChargeTrendChartProps) {
  const viewport = useChartViewport(data);
  const { visibleData } = viewport;
  const router = useRouter();

  const openChargesMonth = ({ activeIndex }: MouseHandlerDataParam) => {
    const period =
      activeIndex === undefined
        ? undefined
        : visibleData[Number(activeIndex)]?.period;

    if (!period) {
      return;
    }

    const apartmentId = series.length === 1 ? series[0].apartmentId : undefined;
    router.push(getChargesHref({ apartmentId, period }));
  };

  if (series.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="charge-trend-fallback"
      >
        Wykres pojawi się, gdy będą dostępne naliczenia z ostatnich 12 miesięcy.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="charge-trend-chart">
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
          <AreaChart
            className="cursor-pointer"
            onClick={openChargesMonth}
            width={width}
            height={height}
            data={visibleData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              {series.map((entry) => (
                <linearGradient
                  key={`${entry.key}-gradient`}
                  id={`${entry.key}-gradient`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={entry.color}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="95%"
                    stopColor={entry.color}
                    stopOpacity={0.03}
                  />
                </linearGradient>
              ))}
            </defs>
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
              domain={[0, 'dataMax']}
              width={Y_AXIS_WIDTH}
              tick={renderYAxisTick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={formatSeriesTooltipAmount}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: CHART_COLORS.tooltip,
                border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                borderRadius: 12,
              }}
            />
            <ReferenceLine
              y={0}
              stroke={CHART_COLORS.zeroLine}
              strokeWidth={1}
            />
            <Legend />
            {series.map((entry) => (
              <Area
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color}
                fill={`url(#${entry.key}-gradient)`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                fillOpacity={1}
              />
            ))}
          </AreaChart>
        )}
      </MeasuredChart>
    </div>
  );
}
