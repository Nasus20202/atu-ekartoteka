import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ListViewMode } from '@/lib/list-view-mode';

const APARTMENT_CARDS = 6;

interface ApartmentListSkeletonProps {
  mode?: ListViewMode;
}

export function ApartmentListSkeleton({
  mode = ListViewMode.CARDS,
}: ApartmentListSkeletonProps) {
  if (mode === ListViewMode.TABLE) {
    return (
      <TableSkeleton
        columns={5}
        rows={8}
        data-testid="apartment-list-skeleton"
      />
    );
  }

  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      data-testid="apartment-list-skeleton"
    >
      {Array.from({ length: APARTMENT_CARDS }, (_, index) => (
        <SkeletonCard key={index} titleWidth="w-44">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function HoaApartmentsSkeleton({
  mode = ListViewMode.CARDS,
}: ApartmentListSkeletonProps) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SkeletonCard titleWidth="w-32">
        <Skeleton className="h-10 w-full" />
      </SkeletonCard>
      <ApartmentListSkeleton mode={mode} />
    </div>
  );
}

export function ApartmentDetailsSkeleton() {
  return (
    <div className="space-y-6" data-testid="apartment-details-skeleton">
      <PageHeaderSkeleton />
      <SkeletonCard titleWidth="w-44">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-48" />
      </SkeletonCard>
      <SkeletonCard titleWidth="w-32">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </SkeletonCard>
    </div>
  );
}
