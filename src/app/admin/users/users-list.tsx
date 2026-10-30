import type { EditMode } from '@/app/admin/users/types';
import { UserCard } from '@/app/admin/users/user-card';
import type { UserFilter } from '@/app/admin/users/user-filters';
import { UsersEmptyState } from '@/app/admin/users/users-empty-state';
import { UsersTable } from '@/app/admin/users/users-table';
import { LoadingCard } from '@/components/ui/loading-card';
import { ViewTransition } from '@/components/ui/view-transition';
import { ListViewMode } from '@/lib/hooks/use-list-view-mode';
import type { UserDto } from '@/lib/types/dto/user-dto';
import type { SortState, UserSortKey } from '@/lib/utils/sort';

interface UsersListProps {
  users: UserDto[];
  loading: boolean;
  error: string | null;
  viewMode: ListViewMode;
  search: string;
  filter: UserFilter;
  actionLoading: boolean;
  onOpenDialog: (user: UserDto, mode: EditMode) => void;
  onReject: (user: UserDto) => void;
  sort: SortState<UserSortKey> | null;
  onSort: (sort: SortState<UserSortKey> | null) => void;
}

export function UsersList({
  users,
  loading,
  error,
  viewMode,
  search,
  filter,
  actionLoading,
  onOpenDialog,
  onReject,
  sort,
  onSort,
}: UsersListProps) {
  const actionProps = { actionLoading, onOpenDialog, onReject };

  const cardProps = (user: UserDto) => ({
    user,
    ...actionProps,
    onApprove: () => onOpenDialog(user, 'approve'),
    onAssignApartment: () => onOpenDialog(user, 'assign-apartment'),
    onChangeStatus: () => onOpenDialog(user, 'change-status'),
    onReject: () => onReject(user),
  });

  return (
    <ViewTransition view={viewMode}>
      {loading ? (
        <LoadingCard />
      ) : users.length === 0 && !error ? (
        <UsersEmptyState search={search} filter={filter} />
      ) : viewMode === ListViewMode.TABLE ? (
        <UsersTable
          users={users}
          {...actionProps}
          sort={sort}
          onSort={onSort}
        />
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <UserCard key={user.id} {...cardProps(user)} />
          ))}
        </div>
      )}
    </ViewTransition>
  );
}
