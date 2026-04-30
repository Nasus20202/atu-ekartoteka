'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_COLORS } from '@/components/charts/chart-colors';
import type { PaymentMonthlyChartDatum } from '@/components/charts/chart-data';
import { MeasuredChart } from '@/components/charts/measured-chart';
import { formatCurrency } from '@/lib/utils';

interface PaymentMonthlyBalanceChartProps {
  data: PaymentMonthlyChartDatum[];
}

export function PaymentMonthlyBalanceChart({
  data,
}: PaymentMonthlyBalanceChartProps) {
  if (data.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="payment-monthly-chart-fallback"
      >
        Brak miesięcznych danych do pokazania na wykresie.
      </p>
    );
  }

  return (
    <MeasuredChart className="h-72 w-full" data-testid="payment-monthly-chart">
      {({ width, height }) => (
        <AreaChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="payments-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.payments}
                stopOpacity={0.22}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.payments}
                stopOpacity={0.04}
              />
            </linearGradient>
            <linearGradient id="charges-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.charges}
                stopOpacity={0.22}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.charges}
                stopOpacity={0.04}
              />
            </linearGradient>
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
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
            tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              String(name),
            ]}
            labelFormatter={(value) => String(value)}
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 12,
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="payments"
            name="Wpłaty"
            stroke={CHART_COLORS.payments}
            fill="url(#payments-gradient)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            fillOpacity={1}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="charges"
            name="Naliczenia"
            stroke={CHART_COLORS.charges}
            fill="url(#charges-gradient)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            fillOpacity={1}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Saldo"
            stroke={CHART_COLORS.balance}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      )}
    </MeasuredChart>
  );
}
