import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';

export function AdminPageSkeleton() {
  return (
    <div className="p-4 md:p-8" data-testid="admin-page-skeleton">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeaderSkeleton />
        <CardListSkeleton cards={1} rows={5} />
      </div>
    </div>
  );
}
