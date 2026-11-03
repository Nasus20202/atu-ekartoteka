import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function UsersPageSkeleton() {
  return (
    <div data-testid="users-page-skeleton">
      <PageHeaderSkeleton />
      <Skeleton className="mb-4 h-10 w-full" />
      <Skeleton className="mb-4 h-9 w-72" />
      <CardListSkeleton cards={3} rows={2} />
    </div>
  );
}
