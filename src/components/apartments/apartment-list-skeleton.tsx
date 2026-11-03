import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';

const APARTMENT_CARDS = 6;

export function ApartmentListSkeleton() {
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

export function HoaApartmentsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SkeletonCard titleWidth="w-32">
        <Skeleton className="h-10 w-full" />
      </SkeletonCard>
      <ApartmentListSkeleton />
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
