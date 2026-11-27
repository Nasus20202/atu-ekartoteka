import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/shared/utils';
import { VOTING_STATUS_LABELS } from '@/lib/voting/rules/voting-status';
import { VotingStatus } from '@/lib/voting/types/voting';

const STATUS_CLASSES: Record<VotingStatus, string> = {
  [VotingStatus.DRAFT]:
    'border-dashed border-muted-foreground/50 bg-muted text-muted-foreground',
  [VotingStatus.ACTIVE]:
    'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [VotingStatus.RESULTS_PUBLISHED]:
    'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [VotingStatus.ARCHIVED]:
    'border-transparent bg-secondary text-secondary-foreground',
};

interface Props {
  status: VotingStatus;
  className?: string;
}

export function VotingStatusBadge({ status, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 whitespace-nowrap',
        STATUS_CLASSES[status],
        className
      )}
    >
      {VOTING_STATUS_LABELS[status]}
    </Badge>
  );
}
