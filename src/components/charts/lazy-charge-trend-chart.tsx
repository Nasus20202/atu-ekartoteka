'use client';

import dynamic from 'next/dynamic';

import { ChartPlaceholder } from '@/components/charts/chart-placeholder';

// recharts is large, so the chart is kept out of the initial page bundle
export const LazyChargeTrendChart = dynamic(
  () =>
    import('@/components/charts/charge-trend-chart').then(
      (module) => module.ChargeTrendChart
    ),
  {
    ssr: false,
    loading: () => <ChartPlaceholder className="h-56" />,
  }
);
