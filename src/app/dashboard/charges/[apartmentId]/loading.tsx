import { Page } from '@/components/layout/page';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';

export default function ApartmentChargesLoading() {
  return (
    <Page maxWidth="4xl">
      <PageHeaderSkeleton />
      <CardListSkeleton cards={1} />
    </Page>
  );
}
