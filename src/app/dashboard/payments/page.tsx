import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { PaymentsOverview } from '@/components/payments/payments-overview';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.payments };

export default function PaymentsPage() {
  return (
    <Page>
      <PageHeader
        title="Wpłaty"
        description="Historia wpłat dla wszystkich lokali"
      />
      <Suspense fallback={<CardListSkeleton />}>
        <PaymentsOverview />
      </Suspense>
    </Page>
  );
}
