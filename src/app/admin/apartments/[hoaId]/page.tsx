import { Suspense } from 'react';

import { HoaApartmentsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { HoaApartmentsSection } from '@/components/apartments/hoa-apartments-section';
import { Page } from '@/components/layout/page';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/list-view-mode';
import { getListViewMode } from '@/lib/list-view-mode-server';

interface HoaApartmentsPageProps {
  params: Promise<{ hoaId: string }>;
  searchParams: Promise<{ search?: string; activeOnly?: string }>;
}

export default async function HoaApartmentsPage({
  params,
  searchParams,
}: HoaApartmentsPageProps) {
  await requireAdminAccess();
  const viewMode = await getListViewMode(LIST_VIEW_STORAGE_KEYS.apartments);

  return (
    <Page maxWidth="7xl">
      <Suspense fallback={<HoaApartmentsSkeleton mode={viewMode} />}>
        <HoaApartmentsSection params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}
