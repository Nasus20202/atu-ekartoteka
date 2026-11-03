import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ListViewMode } from '@/lib/list-view-mode';

interface UsersListSkeletonProps {
  mode: ListViewMode;
}

/** The list in the view the user chose, so the real list replaces it in place. */
export function UsersListSkeleton({ mode }: UsersListSkeletonProps) {
  return mode === ListViewMode.TABLE ? (
    <TableSkeleton columns={4} rows={6} data-testid="users-table-skeleton" />
  ) : (
    <CardListSkeleton cards={3} rows={2} />
  );
}

export function UsersPageSkeleton({ mode }: UsersListSkeletonProps) {
  return (
    <div data-testid="users-page-skeleton">
      <PageHeaderSkeleton />
      <Skeleton className="mb-4 h-10 w-full" />
      <Skeleton className="mb-4 h-9 w-72" />
      <UsersListSkeleton mode={mode} />
    </div>
  );
}
