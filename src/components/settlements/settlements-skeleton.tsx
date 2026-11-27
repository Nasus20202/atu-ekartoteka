import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';

export function SettlementsSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardListSkeleton />
    </>
  );
}
