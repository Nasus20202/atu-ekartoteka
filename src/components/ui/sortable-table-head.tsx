import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import { TableHead } from '@/components/ui/table';
import type { SortDirection } from '@/lib/utils/sort';

interface SortableTableHeadProps {
  label: string;
  direction: SortDirection | null;
  onSort: () => void;
  className?: string;
}

export function SortableTableHead({
  label,
  direction,
  onSort,
  className,
}: SortableTableHeadProps) {
  const ariaSort =
    direction === 'asc'
      ? 'ascending'
      : direction === 'desc'
        ? 'descending'
        : 'none';

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-1 rounded-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        {direction === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        ) : direction === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}
