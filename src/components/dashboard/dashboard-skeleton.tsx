import { GreetingSkeleton } from '@/components/dashboard/skeletons/greeting-skeleton';
import { SkeletonCard } from '@/components/skeletons/skeleton-card';
import { SkeletonRow } from '@/components/skeletons/skeleton-row';

/** Generic page skeleton for dashboard routes that do not stream their own sections. */
export function DashboardSkeleton() {
  return (
    <div className="w-full bg-background" data-testid="dashboard-skeleton">
      <main className="p-4 md:p-8">
        <div className="mx-auto w-full max-w-7xl">
          <GreetingSkeleton />
          <div className="space-y-6">
            <SkeletonCard>
              <SkeletonRow />
              <SkeletonRow />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </SkeletonCard>
          </div>
        </div>
      </main>
    </div>
  );
}
