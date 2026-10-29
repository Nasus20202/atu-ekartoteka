'use client';

import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import { ApartmentSelectionDialog } from '@/app/admin/users/apartment-selection-dialog';
import { createEmptyNewUserData } from '@/app/admin/users/constants';
import { CreateUserDialog } from '@/app/admin/users/create-user-dialog';
import type { EditMode, NewUserFormData } from '@/app/admin/users/types';
import { useAdminUsers } from '@/app/admin/users/use-admin-users';
import { useAvailableApartments } from '@/app/admin/users/use-available-apartments';
import { UserActionsMenu } from '@/app/admin/users/user-actions-menu';
import { UserCard } from '@/app/admin/users/user-card';
import { UserFilters } from '@/app/admin/users/user-filters';
import {
  createUserRequest,
  updateUserRequest,
} from '@/app/admin/users/user-requests';
import { UsersEmptyState } from '@/app/admin/users/users-empty-state';
import { UsersPagination } from '@/app/admin/users/users-pagination';
import {
  filterAndSortApartments,
  getPendingDescription,
} from '@/app/admin/users/utils';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { Input } from '@/components/ui/input';
import { LoadingCard } from '@/components/ui/loading-card';
import { CREDENTIALS_REQUIRED_MESSAGE } from '@/lib/auth/credential-validation';
import { AccountStatus } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';

export default function AdminUsersPage() {
  const confirm = useConfirm();
  const {
    users,
    loading,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    userSearch,
    setUserSearch,
    fetchUsers,
  } = useAdminUsers();
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const apartments = useAvailableApartments(selectedUser);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [apartmentSearch, setApartmentSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [newUserData, setNewUserData] = useState<NewUserFormData>(
    createEmptyNewUserData()
  );

  const closeDialog = useCallback(() => {
    setSelectedUser(null);
    setSelectedApartments([]);
    setApartmentSearch('');
    setEditMode(null);
  }, []);

  const openUserDialog = useCallback((user: UserDto, mode: EditMode) => {
    setSelectedUser(user);
    setSelectedApartments(
      user.apartments?.map((apartment) => apartment.id) || []
    );
    setEditMode(mode);
  }, []);

  const handleUpdateUser = useCallback(
    async (userId: string, status: AccountStatus, apartmentIds?: string[]) => {
      setActionLoading(true);
      const error = await updateUserRequest({ userId, status, apartmentIds });
      if (error) {
        alert(error);
      } else {
        await fetchUsers();
        closeDialog();
      }
      setActionLoading(false);
    },
    [closeDialog, fetchUsers]
  );

  const handleCreateUser = useCallback(async () => {
    if (!newUserData.email || !newUserData.password) {
      alert(CREDENTIALS_REQUIRED_MESSAGE);
      return;
    }

    setActionLoading(true);
    const error = await createUserRequest(newUserData);
    if (error) {
      alert(error);
    } else {
      await fetchUsers();
      setEditMode(null);
      setNewUserData(createEmptyNewUserData());
    }
    setActionLoading(false);
  }, [fetchUsers, newUserData]);

  const handleRejectFromStatusDialog = useCallback(async () => {
    if (!selectedUser) {
      return;
    }

    if (selectedUser.apartments && selectedUser.apartments.length > 0) {
      const confirmed = await confirm({
        title: 'Odrzuć użytkownika',
        description:
          'Odrzucenie użytkownika usunie przypisanie mieszkań. Kontynuować?',
        confirmText: 'Odrzuć',
        cancelText: 'Anuluj',
        variant: 'destructive',
      });

      if (!confirmed) {
        return;
      }
    }

    await handleUpdateUser(selectedUser.id, AccountStatus.REJECTED);
  }, [confirm, handleUpdateUser, selectedUser]);

  const filteredApartments = filterAndSortApartments(
    apartments,
    apartmentSearch,
    selectedApartments,
    selectedUser
  );

  const pendingCount = users.filter(
    (user) => user.status === AccountStatus.PENDING
  ).length;
  const pendingDescription = getPendingDescription(pendingCount);

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title="Użytkownicy"
        description={pendingDescription}
        showBackButton={false}
        action={
          <UserActionsMenu
            onCreateUser={() => {
              setNewUserData(createEmptyNewUserData());
              setEditMode('create-user');
            }}
          />
        }
      />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po imieniu, emailu lub mieszkaniu..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      <UserFilters
        filter={filter}
        onChange={(nextFilter) => {
          setFilter(nextFilter);
          setPage(1);
        }}
      />

      {loading ? (
        <LoadingCard />
      ) : users.length === 0 ? (
        <UsersEmptyState search={userSearch} filter={filter} />
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actionLoading={actionLoading}
              onApprove={() => openUserDialog(user, 'approve')}
              onAssignApartment={() => openUserDialog(user, 'assign-apartment')}
              onChangeStatus={() => openUserDialog(user, 'change-status')}
              onReject={() => handleUpdateUser(user.id, AccountStatus.REJECTED)}
            />
          ))}
        </div>
      )}

      <UsersPagination
        page={page}
        totalPages={totalPages}
        disabled={loading}
        onPageChange={setPage}
      />

      <ApartmentSelectionDialog
        actionLoading={actionLoading}
        apartmentSearch={apartmentSearch}
        editMode={editMode}
        filteredApartments={filteredApartments}
        onApartmentSearchChange={setApartmentSearch}
        onApproveOrAssign={() => {
          if (!selectedUser) {
            return;
          }

          void handleUpdateUser(
            selectedUser.id,
            AccountStatus.APPROVED,
            selectedApartments
          );
        }}
        onCancel={closeDialog}
        onReject={() => {
          void handleRejectFromStatusDialog();
        }}
        onSelectApartment={(apartmentId, checked) => {
          setSelectedApartments((current) =>
            checked
              ? [...current, apartmentId]
              : current.filter((id) => id !== apartmentId)
          );
        }}
        onSetApproved={() => {
          if (!selectedUser) {
            return;
          }

          void handleUpdateUser(
            selectedUser.id,
            AccountStatus.APPROVED,
            selectedUser.apartments?.map((apartment) => apartment.id) || []
          );
        }}
        open={selectedUser !== null}
        selectedApartments={selectedApartments}
        selectedUser={selectedUser}
      />

      <CreateUserDialog
        actionLoading={actionLoading}
        newUserData={newUserData}
        onCancel={() => {
          setEditMode(null);
          setNewUserData(createEmptyNewUserData());
        }}
        onChange={setNewUserData}
        onSubmit={() => {
          void handleCreateUser();
        }}
        open={editMode === 'create-user'}
      />
    </Page>
  );
}
