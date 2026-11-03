import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ChargesOverview } from '@/components/charges/charges-overview';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.charges };

export default function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  return (
    <Page>
      <PageHeader title="Naliczenia" />
      <Suspense fallback={<CardListSkeleton />}>
        <ChargesOverview searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}
