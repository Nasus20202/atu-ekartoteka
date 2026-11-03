import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';

const HOA_CARDS = 6;

export function HoaGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      data-testid="hoa-grid-skeleton"
    >
      {Array.from({ length: HOA_CARDS }, (_, index) => (
        <SkeletonCard key={index} titleWidth="w-40">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function HoaListSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard titleWidth="w-32">
        <Skeleton className="h-10 w-full" />
      </SkeletonCard>
      <HoaGridSkeleton />
    </div>
  );
}
