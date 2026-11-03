import { Suspense } from 'react';

import { HoaApartmentsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { HoaApartmentsSection } from '@/components/apartments/hoa-apartments-section';
import { Page } from '@/components/layout/page';

interface HoaApartmentsPageProps {
  params: Promise<{ hoaId: string }>;
  searchParams: Promise<{ search?: string; activeOnly?: string }>;
}

export default function HoaApartmentsPage({
  params,
  searchParams,
}: HoaApartmentsPageProps) {
  return (
    <Page maxWidth="7xl">
      <Suspense fallback={<HoaApartmentsSkeleton />}>
        <HoaApartmentsSection params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}
