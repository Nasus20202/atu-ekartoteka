import { NAVIGABLE_CHART_PLACEHOLDER_CLASS } from '@/components/charts/chart-placeholder';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { SkeletonRow } from '@/components/skeletons/skeleton-row';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ChargesCardSkeleton() {
  return (
    <SkeletonCard titleWidth="w-36">
      <div className="grid gap-3 sm:grid-cols-2">
        <SkeletonRow />
        <SkeletonRow />
      </div>
      <Skeleton className={cn('w-full', NAVIGABLE_CHART_PLACEHOLDER_CLASS)} />
    </SkeletonCard>
  );
}
