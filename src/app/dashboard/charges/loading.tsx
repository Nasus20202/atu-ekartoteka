import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';

export default function ChargesLoading() {
  return (
    <Page>
      <PageHeader title="Naliczenia" />
      <CardListSkeleton />
    </Page>
  );
}
