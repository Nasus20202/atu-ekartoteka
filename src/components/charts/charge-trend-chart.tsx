'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_COLORS } from '@/components/charts/chart-colors';
import type {
  ChargeTrendDatum,
  ChargeTrendSeries,
} from '@/components/charts/chart-data';
import { MeasuredChart } from '@/components/charts/measured-chart';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

const VIEWPORT_SIZE = 12;
const yAxisTickFormatter = new Intl.NumberFormat('pl-PL', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface ChargeTrendChartProps {
  data: ChargeTrendDatum[];
  series: ChargeTrendSeries[];
}

export function ChargeTrendChart({ data, series }: ChargeTrendChartProps) {
  const maxOffset = Math.max(data.length - VIEWPORT_SIZE, 0);
  const [offset, setOffset] = useState(maxOffset);

  const visibleData = useMemo(
    () => data.slice(offset, offset + VIEWPORT_SIZE),
    [data, offset]
  );

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
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Pokazano {visibleData[0]?.label} - {visibleData.at(-1)?.label}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOffset((current) => Math.max(current - 1, 0))}
            disabled={offset === 0}
            aria-label="Pokaż wcześniejsze miesiące"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setOffset((current) => Math.min(current + 1, maxOffset))
            }
            disabled={offset >= maxOffset}
            aria-label="Pokaż nowsze miesiące"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <MeasuredChart className="h-56 w-full">
        {({ width, height }) => (
          <AreaChart
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
              width={44}
              tickFormatter={(value: number) =>
                yAxisTickFormatter.format(value)
              }
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, _name, item) => [
                formatCurrency(Number(value)),
                String(item.name),
              ]}
              labelFormatter={(value) => String(value)}
              contentStyle={{
                backgroundColor: CHART_COLORS.tooltip,
                border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                borderRadius: 12,
              }}
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
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        )}
      </MeasuredChart>
    </div>
  );
}
