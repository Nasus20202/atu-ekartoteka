import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PaymentApartmentSection } from '@/components/payments/payment-apartment-section';
import { PaymentChartSection } from '@/components/payments/payment-chart-section';
import { PaymentChartSkeleton } from '@/components/payments/payment-chart-skeleton';
import { PaymentDetailsHeader } from '@/components/payments/payment-details-header';
import type { PaymentDetailsParams } from '@/components/payments/payment-details-params';
import { PaymentSummarySection } from '@/components/payments/payment-summary-section';
import { PaymentSummarySkeleton } from '@/components/payments/payment-summary-skeleton';
import { PaymentTableSection } from '@/components/payments/payment-table-section';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.paymentsFallback };

// Every section reads the same memoized queries and streams in on its own
export default function PaymentDetailsPage({ params }: PaymentDetailsParams) {
  return (
    <Page maxWidth="4xl">
      <Suspense fallback={<PageHeaderSkeleton />}>
        <PaymentDetailsHeader params={params} />
      </Suspense>

      <div className="space-y-6">
        <Suspense fallback={<PaymentSummarySkeleton />}>
          <PaymentSummarySection params={params} />
        </Suspense>
        <Suspense fallback={<PaymentChartSkeleton />}>
          <PaymentChartSection params={params} />
        </Suspense>
        <Suspense fallback={<CardListSkeleton cards={1} rows={6} />}>
          <PaymentTableSection params={params} />
        </Suspense>
        <Suspense fallback={<SkeletonCard description={false} />}>
          <PaymentApartmentSection params={params} />
        </Suspense>
      </div>
    </Page>
  );
}
