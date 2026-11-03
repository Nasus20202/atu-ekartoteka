'use client';

import dynamic from 'next/dynamic';

import {
  ChartPlaceholder,
  PAYMENT_CHART_PLACEHOLDER_CLASS,
} from '@/components/charts/chart-placeholder';

// recharts is large, so the chart is kept out of the initial page bundle
export const LazyPaymentMonthlyBalanceChart = dynamic(
  () =>
    import('@/components/charts/payment-monthly-balance-chart').then(
      (module) => module.PaymentMonthlyBalanceChart
    ),
  {
    ssr: false,
    loading: () => (
      <ChartPlaceholder className={PAYMENT_CHART_PLACEHOLDER_CLASS} />
    ),
  }
);
