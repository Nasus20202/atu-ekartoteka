import { Suspense } from 'react';

import { ApartmentDetailsSection } from '@/components/apartments/apartment-details-section';
import { ApartmentDetailsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { Page } from '@/components/layout/page';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';

interface ApartmentDetailsPageProps {
  params: Promise<{ hoaId: string; apartmentId: string }>;
}

export default async function ApartmentDetailsPage({
  params,
}: ApartmentDetailsPageProps) {
  await requireAdminAccess();

  return (
    <Page maxWidth="6xl">
      <Suspense fallback={<ApartmentDetailsSkeleton />}>
        <ApartmentDetailsSection params={params} />
      </Suspense>
    </Page>
  );
}
