'use client';

import { AlertCircle, Search, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApartmentSelectionDialog } from '@/app/admin/users/apartment-selection-dialog';
import { createEmptyNewUserData } from '@/app/admin/users/constants';
import { CreateUserDialog } from '@/app/admin/users/create-user-dialog';
import type {
  Apartment,
  EditMode,
  NewUserFormData,
  User,
} from '@/app/admin/users/types';
import { UserCard } from '@/app/admin/users/user-card';
import { type UserFilter, UserFilters } from '@/app/admin/users/user-filters';
import {
  buildUsersQuery,
  filterAndSortApartments,
  getAvailableApartments,
  getPendingDescription,
} from '@/app/admin/users/utils';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { LoadingCard } from '@/components/ui/loading-card';
import { AccountStatus } from '@/lib/types';

const APARTMENT_FETCH_LIMIT = 100000;

export default function AdminUsersPage() {
  const confirm = useConfirm();
  const latestUsersRequestId = useRef(0);
  const [users, setUsers] = useState<User[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilter>(AccountStatus.PENDING);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  const fetchUsers = useCallback(async () => {
    const requestId = ++latestUsersRequestId.current;
    setLoading(true);

    try {
      const query = buildUsersQuery(filter, page, debouncedSearch);
      const response = await fetch(`/api/admin/users?${query}`);
      const data = await response.json();

      if (response.ok && requestId === latestUsersRequestId.current) {
        setUsers(data.users);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      if (requestId === latestUsersRequestId.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, filter, page]);

  const fetchApartments = useCallback(async () => {
    try {
      const apartmentParams = new URLSearchParams({
        page: '1',
        limit: String(APARTMENT_FETCH_LIMIT),
        activeOnly: 'false',
      });

      const response = await fetch(`/api/admin/apartments?${apartmentParams}`);
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      const [tenantUsersResponse, adminUsersResponse] = await Promise.all([
        fetch('/api/admin/users?limit=1000'),
        fetch('/api/admin/users?role=ADMIN&limit=1000'),
      ]);
      const [tenantUsersData, adminUsersData] = await Promise.all([
        tenantUsersResponse.json(),
        adminUsersResponse.json(),
      ]);

      const allUsers = [
        ...(tenantUsersData.users || []),
        ...(adminUsersData.users || []),
      ];

      setApartments(
        getAvailableApartments(data.apartments, allUsers, selectedUser)
      );
    } catch (error) {
      console.error('Failed to fetch apartments:', error);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userSearch);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    fetchApartments();
    setSelectedApartments(selectedUser.apartments?.map((apt) => apt.id) || []);
  }, [fetchApartments, selectedUser]);

  const handleUpdateUser = useCallback(
    async (userId: string, status: AccountStatus, apartmentIds?: string[]) => {
      setActionLoading(true);

      try {
        const response = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            status,
            apartmentIds,
          }),
        });

        if (response.ok) {
          await fetchUsers();
          closeDialog();
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to update user');
        }
      } catch (error) {
        console.error('Failed to update user:', error);
        alert('Failed to update user');
      } finally {
        setActionLoading(false);
      }
    },
    [closeDialog, fetchUsers]
  );

  const handleCreateUser = useCallback(async () => {
    if (!newUserData.email || !newUserData.password) {
      alert('Email i hasło są wymagane');
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData),
      });

      if (response.ok) {
        await fetchUsers();
        setEditMode(null);
        setNewUserData(createEmptyNewUserData());
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    } finally {
      setActionLoading(false);
    }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Akcje
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setNewUserData(createEmptyNewUserData());
                  setEditMode('create-user');
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Dodaj użytkownika
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/users/management">
                  <Users className="mr-2 h-4 w-4" />
                  Zarządzanie kontami
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Brak użytkowników</p>
            <p className="text-sm text-muted-foreground">
              {userSearch
                ? 'Nie znaleziono użytkowników pasujących do wyszukiwania'
                : filter === AccountStatus.PENDING
                  ? 'Brak kont oczekujących na zatwierdzenie'
                  : 'Nie znaleziono użytkowników'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actionLoading={actionLoading}
              onApprove={() => {
                setSelectedUser(user);
                setEditMode('approve');
              }}
              onAssignApartment={() => {
                setSelectedUser(user);
                setEditMode('assign-apartment');
              }}
              onChangeStatus={() => {
                setSelectedUser(user);
                setEditMode('change-status');
              }}
              onReject={() => handleUpdateUser(user.id, AccountStatus.REJECTED)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((currentPage) => Math.max(1, currentPage - 1))
            }
            disabled={page <= 1 || loading}
          >
            Poprzednia
          </Button>
          <span className="text-sm text-muted-foreground">
            Strona {page} z {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((currentPage) => Math.min(totalPages, currentPage + 1))
            }
            disabled={page >= totalPages || loading}
          >
            Następna
          </Button>
        </div>
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
