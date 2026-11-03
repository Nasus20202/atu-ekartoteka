import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { SkeletonRow } from '@/components/skeletons/skeleton-row';

export function NotificationsCardSkeleton() {
  return (
    <SkeletonCard titleWidth="w-40">
      <SkeletonRow subtitle={false} />
      <SkeletonRow subtitle={false} />
      <SkeletonRow subtitle={false} />
    </SkeletonCard>
  );
}
