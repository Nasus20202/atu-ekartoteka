import { Check, X } from 'lucide-react';

import { UserStatusBadge } from '@/app/admin/users/user-status-badge';
import { Button } from '@/components/ui/button';
import { AccountStatus } from '@/lib/types';

interface StatusChangePanelProps {
  status: AccountStatus;
  actionLoading: boolean;
  onSetApproved: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export function StatusChangePanel({
  status,
  actionLoading,
  onSetApproved,
  onReject,
  onCancel,
}: StatusChangePanelProps) {
  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Obecny status: <UserStatusBadge status={status} />
        </p>
        <div className="space-y-2">
          <Button
            variant={status === AccountStatus.APPROVED ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={onSetApproved}
            disabled={actionLoading || status === AccountStatus.APPROVED}
          >
            <Check className="mr-2 h-4 w-4" />
            Zatwierdzony
          </Button>
          <Button
            variant={
              status === AccountStatus.REJECTED ? 'destructive' : 'outline'
            }
            className="w-full justify-start"
            onClick={onReject}
            disabled={actionLoading || status === AccountStatus.REJECTED}
          >
            <X className="mr-2 h-4 w-4" />
            Odrzucony
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={actionLoading}
          className="flex-1"
        >
          Anuluj
        </Button>
      </div>
    </>
  );
}
