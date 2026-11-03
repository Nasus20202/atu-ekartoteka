import { ApartmentDetailsSkeleton } from '@/components/apartments/apartment-list-skeleton';
import { Page } from '@/components/layout/page';

export default function ApartmentDetailsLoading() {
  return (
    <Page maxWidth="6xl">
      <ApartmentDetailsSkeleton />
    </Page>
  );
}
