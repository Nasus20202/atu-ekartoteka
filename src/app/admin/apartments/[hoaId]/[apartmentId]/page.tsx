import { Suspense } from 'react';

import { ApartmentDetailsSection } from '@/components/apartments/apartment-details-section';
import { ApartmentDetailsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { Page } from '@/components/layout/page';

interface ApartmentDetailsPageProps {
  params: Promise<{ hoaId: string; apartmentId: string }>;
}

export default function ApartmentDetailsPage({
  params,
}: ApartmentDetailsPageProps) {
  return (
    <Page maxWidth="6xl">
      <Suspense fallback={<ApartmentDetailsSkeleton />}>
        <ApartmentDetailsSection params={params} />
      </Suspense>
    </Page>
  );
}
