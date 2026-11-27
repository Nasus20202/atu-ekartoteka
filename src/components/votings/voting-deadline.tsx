import { Clock } from 'lucide-react';

import { formatDateTime } from '@/lib/shared/utils/format-date-time';

interface Props {
  endsAt: string | null;
}

export function VotingDeadline({ endsAt }: Props) {
  if (!endsAt) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" aria-hidden />
      Termin: {formatDateTime(endsAt)}
    </span>
  );
}
