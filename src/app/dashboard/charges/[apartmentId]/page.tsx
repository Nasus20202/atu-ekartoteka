import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ApartmentChargesContent } from '@/components/charges/apartment-charges-content';
import { ApartmentChargesHeader } from '@/components/charges/apartment-charges-header';
import { Page } from '@/components/layout/page';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.chargesFallback };

export default function ApartmentChargesPage({
  params,
  searchParams,
}: {
  params: Promise<{ apartmentId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  return (
    <Page maxWidth="4xl">
      <Suspense fallback={<PageHeaderSkeleton />}>
        <ApartmentChargesHeader params={params} />
      </Suspense>
      <Suspense fallback={<CardListSkeleton cards={1} />}>
        <ApartmentChargesContent params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}
