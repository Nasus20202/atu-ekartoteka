import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { SkeletonRow } from '@/components/skeletons/skeleton-row';

interface CardListSkeletonProps {
  cards?: number;
  rows?: number;
}

export function CardListSkeleton({
  cards = 2,
  rows = 3,
}: CardListSkeletonProps) {
  return (
    <div className="space-y-6" data-testid="card-list-skeleton">
      {Array.from({ length: cards }, (_, card) => (
        <SkeletonCard key={card}>
          {Array.from({ length: rows }, (_, row) => (
            <SkeletonRow key={row} />
          ))}
        </SkeletonCard>
      ))}
    </div>
  );
}
