import { Skeleton } from '@/components/ui/skeleton';

interface PageHeaderSkeletonProps {
  description?: boolean;
}

export function PageHeaderSkeleton({
  description = true,
}: PageHeaderSkeletonProps) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Skeleton className="h-10 w-10 shrink-0" />
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        {description && <Skeleton className="h-4 w-72 max-w-full" />}
      </div>
    </div>
  );
}
