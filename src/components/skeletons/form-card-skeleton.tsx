import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';

export function FormCardSkeleton() {
  return (
    <SkeletonCard titleWidth="w-36">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </SkeletonCard>
  );
}
