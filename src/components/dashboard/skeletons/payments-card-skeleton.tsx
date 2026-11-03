import { NAVIGABLE_CHART_PLACEHOLDER_CLASS } from '@/components/charts/chart-placeholder';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { SkeletonRow } from '@/components/skeletons/skeleton-row';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PaymentsCardSkeleton() {
  return (
    <SkeletonCard titleWidth="w-32">
      <SkeletonRow />
      <SkeletonRow />
      <Skeleton className={cn('w-full', NAVIGABLE_CHART_PLACEHOLDER_CLASS)} />
    </SkeletonCard>
  );
}
