import { HoaApartmentsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { Page } from '@/components/layout/page';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/list-view-mode';
import { getListViewMode } from '@/lib/list-view-mode-server';

export default async function HoaApartmentsLoading() {
  const viewMode = await getListViewMode(LIST_VIEW_STORAGE_KEYS.apartments);

  return (
    <Page maxWidth="7xl">
      <HoaApartmentsSkeleton mode={viewMode} />
    </Page>
  );
}
