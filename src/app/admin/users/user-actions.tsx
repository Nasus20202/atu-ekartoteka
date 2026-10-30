import {
  Edit,
  type LucideIcon,
  MoreVertical,
  UserCheck,
  UserX,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountStatus } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';

export interface UserActionsProps {
  actionLoading: boolean;
  onApprove: () => void;
  onAssignApartment: () => void;
  onChangeStatus: () => void;
  onReject: () => void;
  user: UserDto;
}

interface UserAction {
  label: string;
  Icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
}

function getUserActions({
  onApprove,
  onAssignApartment,
  onChangeStatus,
  onReject,
  user,
}: UserActionsProps): UserAction[] {
  const changeStatus = {
    label: 'Zmień status',
    Icon: Edit,
    onSelect: onChangeStatus,
  };

  switch (user.status) {
    case AccountStatus.PENDING:
      return [
        { label: 'Zatwierdź', Icon: UserCheck, onSelect: onApprove },
        { label: 'Odrzuć', Icon: UserX, onSelect: onReject, destructive: true },
      ];
    case AccountStatus.APPROVED:
      return [
        {
          label: `Mieszkania (${user.apartments?.length || 0})`,
          Icon: Edit,
          onSelect: onAssignApartment,
        },
        changeStatus,
      ];
    default:
      return [changeStatus];
  }
}

export function UserActionButtons(props: UserActionsProps) {
  return getUserActions(props).map(({ label, Icon, onSelect, destructive }) => (
    <Button
      key={label}
      size="sm"
      variant="outline"
      disabled={props.actionLoading}
      className={
        destructive ? 'text-destructive hover:text-destructive' : undefined
      }
      onClick={onSelect}
    >
      <Icon className="mr-1 h-4 w-4" />
      {label}
    </Button>
  ));
}

export function UserActionMenu(props: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={props.actionLoading}
          aria-label="Akcje"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {getUserActions(props).map(({ label, Icon, onSelect, destructive }) => (
          <DropdownMenuItem
            key={label}
            className={
              destructive
                ? 'text-destructive focus:text-destructive'
                : undefined
            }
            onSelect={onSelect}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
