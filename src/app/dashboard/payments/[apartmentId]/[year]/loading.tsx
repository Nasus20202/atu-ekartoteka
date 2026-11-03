import { Page } from '@/components/layout/page';
import { PaymentChartSkeleton } from '@/components/payments/payment-chart-skeleton';
import { PaymentSummarySkeleton } from '@/components/payments/payment-summary-skeleton';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';

export default function PaymentDetailsLoading() {
  return (
    <Page maxWidth="4xl">
      <PageHeaderSkeleton />
      <div className="space-y-6">
        <PaymentSummarySkeleton />
        <PaymentChartSkeleton />
        <CardListSkeleton cards={1} rows={6} />
        <SkeletonCard description={false} />
      </div>
    </Page>
  );
}
