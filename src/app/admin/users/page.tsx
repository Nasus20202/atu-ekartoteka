'use client';

import { Search } from 'lucide-react';

import { ApartmentSelectionDialog } from '@/app/admin/users/apartment-selection-dialog';
import { CreateUserDialog } from '@/app/admin/users/create-user-dialog';
import { useAdminUsers } from '@/app/admin/users/use-admin-users';
import { useAvailableApartments } from '@/app/admin/users/use-available-apartments';
import { usePendingCount } from '@/app/admin/users/use-pending-count';
import { useUserActions } from '@/app/admin/users/use-user-actions';
import { UserActionsMenu } from '@/app/admin/users/user-actions-menu';
import { UserFilters } from '@/app/admin/users/user-filters';
import { UsersList } from '@/app/admin/users/users-list';
import {
  getPendingDescription,
  pinSelectedAndMatching,
} from '@/app/admin/users/utils';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { InfiniteScrollSentinel } from '@/components/ui/infinite-scroll-sentinel';
import { Input } from '@/components/ui/input';
import { ListViewSwitch } from '@/components/ui/list-view-switch';
import {
  LIST_VIEW_STORAGE_KEYS,
  useListViewMode,
} from '@/lib/hooks/use-list-view-mode';
import { AccountStatus } from '@/lib/types';

export default function AdminUsersPage() {
  const {
    users,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    filter,
    setFilter,
    userSearch,
    setUserSearch,
    sort,
    setSort,
  } = useAdminUsers();
  const { pendingCount, reload: reloadPendingCount } = usePendingCount();
  const refreshUsersAndCount = async () => {
    reloadPendingCount();
    await refresh();
  };
  const {
    selectedUser,
    selectedApartments,
    setSelectedApartments,
    apartmentSearch,
    setApartmentSearch,
    actionLoading,
    editMode,
    newUserData,
    setNewUserData,
    closeDialog,
    openUserDialog,
    openCreateDialog,
    closeCreateDialog,
    handleUpdateUser,
    handleCreateUser,
    handleRejectFromStatusDialog,
  } = useUserActions(refreshUsersAndCount);
  const apartments = useAvailableApartments(selectedUser, apartmentSearch);
  const [viewMode, setViewMode] = useListViewMode(LIST_VIEW_STORAGE_KEYS.users);

  const filteredApartments = pinSelectedAndMatching(
    apartments,
    selectedApartments,
    selectedUser
  );

  const pendingDescription = getPendingDescription(pendingCount);

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title="Użytkownicy"
        description={pendingDescription}
        showBackButton={false}
        action={<UserActionsMenu onCreateUser={openCreateDialog} />}
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
        onChange={setFilter}
        action={<ListViewSwitch value={viewMode} onChange={setViewMode} />}
      />

      <UsersList
        users={users}
        loading={loading}
        error={error}
        viewMode={viewMode}
        search={userSearch}
        filter={filter}
        actionLoading={actionLoading}
        onOpenDialog={openUserDialog}
        onReject={(user) => handleUpdateUser(user.id, AccountStatus.REJECTED)}
        sort={sort}
        onSort={setSort}
      />

      {!loading && (
        <InfiniteScrollSentinel
          hasMore={hasMore}
          loading={loadingMore}
          error={error}
          onLoadMore={loadMore}
        />
      )}

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
        onCancel={closeCreateDialog}
        onChange={setNewUserData}
        onSubmit={() => {
          void handleCreateUser();
        }}
        open={editMode === 'create-user'}
      />
    </Page>
  );
}
