import { HoaApartmentsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { Page } from '@/components/layout/page';

export default function HoaApartmentsLoading() {
  return (
    <Page maxWidth="7xl">
      <HoaApartmentsSkeleton />
    </Page>
  );
}
