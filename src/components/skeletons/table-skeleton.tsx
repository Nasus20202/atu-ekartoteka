import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  'data-testid'?: string;
}

/** A bordered table with a header row and placeholder rows. */
export function TableSkeleton({
  columns = 4,
  rows = 6,
  'data-testid': dataTestId = 'table-skeleton',
}: TableSkeletonProps) {
  return (
    <div
      className="overflow-hidden rounded-md border"
      data-testid={dataTestId}
      aria-hidden="true"
    >
      <div className="flex gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }, (_, column) => (
          <Skeleton key={column} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
