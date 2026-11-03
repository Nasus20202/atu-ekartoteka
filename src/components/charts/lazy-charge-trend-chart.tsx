'use client';

import dynamic from 'next/dynamic';

import {
  ChartPlaceholder,
  NAVIGABLE_CHART_PLACEHOLDER_CLASS,
} from '@/components/charts/chart-placeholder';

// recharts is large, so the chart is kept out of the initial page bundle
export const LazyChargeTrendChart = dynamic(
  () =>
    import('@/components/charts/charge-trend-chart').then(
      (module) => module.ChargeTrendChart
    ),
  {
    ssr: false,
    loading: () => (
      <ChartPlaceholder className={NAVIGABLE_CHART_PLACEHOLDER_CLASS} />
    ),
  }
);
