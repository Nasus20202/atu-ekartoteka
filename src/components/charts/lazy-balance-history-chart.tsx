'use client';

import dynamic from 'next/dynamic';

import { ChartPlaceholder } from '@/components/charts/chart-placeholder';

// recharts is large, so the chart is kept out of the initial page bundle
export const LazyBalanceHistoryChart = dynamic(
  () =>
    import('@/components/charts/balance-history-chart').then(
      (module) => module.BalanceHistoryChart
    ),
  {
    ssr: false,
    loading: () => <ChartPlaceholder className="h-56" />,
  }
);
