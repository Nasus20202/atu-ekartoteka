import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { SkeletonRow } from '@/components/skeletons/skeleton-row';

export function VotingsCardSkeleton() {
  return (
    <SkeletonCard titleWidth="w-32">
      <SkeletonRow />
      <SkeletonRow />
    </SkeletonCard>
  );
}
