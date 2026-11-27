import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ListViewMode } from '@/lib/shared/list-view-mode';

interface Props {
  mode: ListViewMode;
}

/** The filters and the list in the view the admin chose. */
export function AdminVotingsSkeleton({ mode }: Props) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full sm:w-96" />
      {mode === ListViewMode.TABLE ? (
        <TableSkeleton
          columns={7}
          rows={6}
          data-testid="votings-table-skeleton"
        />
      ) : (
        <CardListSkeleton cards={3} rows={2} />
      )}
    </div>
  );
}
