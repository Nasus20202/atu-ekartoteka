import { Clock } from 'lucide-react';

import { cn } from '@/lib/shared/utils';
import { formatDateTime } from '@/lib/shared/utils/format-date-time';

interface Props {
  endsAt: string | null;
  /** The deadline has passed while the voting was still active. */
  passed?: boolean;
}

export function VotingDeadline({ endsAt, passed = false }: Props) {
  if (!endsAt) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
        passed && 'font-medium text-amber-700 dark:text-amber-400'
      )}
    >
      <Clock className="h-4 w-4" aria-hidden />
      {passed ? 'Zakończono' : 'Termin'}: {formatDateTime(endsAt)}
    </span>
  );
}
