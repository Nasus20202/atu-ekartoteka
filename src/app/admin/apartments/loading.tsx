import { HoaListSkeleton } from '@/components/apartments/hoa-list-skeleton';
import { HoaNoticesButton } from '@/components/apartments/hoa-notices-button';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';

export default function ApartmentsLoading() {
  return (
    <Page maxWidth="7xl">
      <PageHeader
        title="Wspólnoty mieszkaniowe"
        description="Wybierz wspólnotę, aby zobaczyć mieszkania"
        showBackButton={false}
        action={<HoaNoticesButton />}
      />
      <HoaListSkeleton />
    </Page>
  );
}
