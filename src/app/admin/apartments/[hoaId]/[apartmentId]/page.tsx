import { Suspense } from 'react';

import { ApartmentDetailsSection } from '@/components/apartments/apartment-details-section';
import { ApartmentDetailsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { Page } from '@/components/layout/page';
import type { SettlementSearchParams } from '@/components/settlements/settlement-search-params';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';

interface ApartmentDetailsPageProps {
  params: Promise<{ hoaId: string; apartmentId: string }>;
  searchParams: Promise<SettlementSearchParams>;
}

export default async function ApartmentDetailsPage({
  params,
  searchParams,
}: ApartmentDetailsPageProps) {
  await requireAdminAccess();

  return (
    <Page maxWidth="6xl">
      <Suspense fallback={<ApartmentDetailsSkeleton />}>
        <ApartmentDetailsSection params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}
