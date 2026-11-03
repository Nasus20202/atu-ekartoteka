import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';

export function ApartmentsCardSkeleton() {
  return (
    <SkeletonCard titleWidth="w-44" description={false}>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </SkeletonCard>
  );
}
