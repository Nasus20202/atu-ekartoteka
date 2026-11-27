import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import type { SettlementSearchParams } from '@/components/settlements/settlement-search-params';
import { SettlementsSkeleton } from '@/components/settlements/settlements-skeleton';
import { TenantSettlementsSection } from '@/components/settlements/tenant-settlements-section';
import { PAGE_TITLES } from '@/lib/shared/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.settlements };

export default function ApartmentSettlementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ apartmentId: string }>;
  searchParams: Promise<SettlementSearchParams>;
}) {
  return (
    <Page>
      <Suspense fallback={<SettlementsSkeleton />}>
        <TenantSettlementsSection params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}
