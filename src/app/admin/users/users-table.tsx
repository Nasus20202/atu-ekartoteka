'use client';

import type { EditMode } from '@/app/admin/users/types';
import {
  UserActionMenu,
  type UserActionsProps,
} from '@/app/admin/users/user-actions';
import { UserStatusBadge } from '@/app/admin/users/user-status-badge';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserDto } from '@/lib/types/dto/user-dto';
import { APARTMENT_FORMS, pluralizePl } from '@/lib/utils/pluralize';
import { type SortState, toggleSort, type UserSortKey } from '@/lib/utils/sort';

interface UsersTableProps {
  users: UserDto[];
  actionLoading: boolean;
  onOpenDialog: (user: UserDto, mode: EditMode) => void;
  onReject: (user: UserDto) => void;
  sort: SortState<UserSortKey> | null;
  onSort: (sort: SortState<UserSortKey> | null) => void;
}

function userActionsProps(
  user: UserDto,
  { actionLoading, onOpenDialog, onReject }: UsersTableProps
): UserActionsProps {
  return {
    user,
    actionLoading,
    onApprove: () => onOpenDialog(user, 'approve'),
    onAssignApartment: () => onOpenDialog(user, 'assign-apartment'),
    onChangeStatus: () => onOpenDialog(user, 'change-status'),
    onReject: () => onReject(user),
  };
}

export function UsersTable(props: UsersTableProps) {
  const directionOf = (key: UserSortKey) =>
    props.sort?.key === key ? props.sort.direction : null;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              label="Użytkownik"
              direction={directionOf('name')}
              onSort={() => props.onSort(toggleSort(props.sort, 'name'))}
            />
            <SortableTableHead
              label="E-mail"
              direction={directionOf('email')}
              onSort={() => props.onSort(toggleSort(props.sort, 'email'))}
            />
            <SortableTableHead
              label="Status"
              direction={directionOf('status')}
              onSort={() => props.onSort(toggleSort(props.sort, 'status'))}
            />
            <SortableTableHead
              label="Mieszkania"
              direction={directionOf('apartments')}
              onSort={() => props.onSort(toggleSort(props.sort, 'apartments'))}
              className="text-right"
            />
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.users.map((user) => {
            const apartmentCount = user.apartments?.length ?? 0;

            return (
              <TableRow key={user.id}>
                <TableCell className="max-w-[14rem] truncate font-medium">
                  {user.name || user.email}
                </TableCell>
                <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {apartmentCount}{' '}
                  {pluralizePl(apartmentCount, APARTMENT_FORMS)}
                </TableCell>
                <TableCell>
                  <UserActionMenu {...userActionsProps(user, props)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
