import { Check, Clock, X } from 'lucide-react';

import { AccountStatus } from '@/lib/types';

interface UserStatusBadgeProps {
  status: AccountStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  switch (status) {
    case AccountStatus.PENDING:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3" />
          Oczekuje
        </span>
      );
    case AccountStatus.APPROVED:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
          <Check className="h-3 w-3" />
          Zatwierdzony
        </span>
      );
    case AccountStatus.REJECTED:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          <X className="h-3 w-3" />
          Odrzucony
        </span>
      );
    default:
      return null;
  }
}
