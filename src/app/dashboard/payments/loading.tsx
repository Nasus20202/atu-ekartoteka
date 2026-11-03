import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';

export default function PaymentsLoading() {
  return (
    <Page>
      <PageHeader
        title="Wpłaty"
        description="Historia wpłat dla wszystkich lokali"
      />
      <CardListSkeleton />
    </Page>
  );
}
