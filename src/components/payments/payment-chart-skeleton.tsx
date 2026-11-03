import { PAYMENT_CHART_PLACEHOLDER_CLASS } from '@/components/charts/chart-placeholder';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PaymentChartSkeleton() {
  return (
    <SkeletonCard titleWidth="w-48">
      <Skeleton className={cn('w-full', PAYMENT_CHART_PLACEHOLDER_CLASS)} />
    </SkeletonCard>
  );
}
