import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonRowProps {
  subtitle?: boolean;
}

/** Bordered list row: a title with an optional subtitle and an amount on the right. */
export function SkeletonRow({ subtitle = true }: SkeletonRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-32 max-w-full" />
        {subtitle && <Skeleton className="h-4 w-48 max-w-full" />}
      </div>
      <Skeleton className="h-7 w-24 shrink-0" />
    </div>
  );
}
