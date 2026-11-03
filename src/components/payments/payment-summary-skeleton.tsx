import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';

export function PaymentSummarySkeleton() {
  return (
    <SkeletonCard titleWidth="w-56">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, tile) => (
          <Skeleton key={tile} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </SkeletonCard>
  );
}
