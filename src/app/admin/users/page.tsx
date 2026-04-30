'use client';

import {
  AlertCircle,
  Check,
  Clock,
  Edit,
  MoreVertical,
  Search,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { type UserFilter, UserFilters } from '@/app/admin/users/user-filters';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingCard } from '@/components/ui/loading-card';
import { Select } from '@/components/ui/select';
import { AccountStatus } from '@/lib/types';
import { type ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import { type UserDto } from '@/lib/types/dto/user-dto';

type User = UserDto;
type Apartment = ApartmentSummaryDto;

const ROLE_OPTIONS = [
  { value: 'TENANT', label: 'Użytkownik' },
  { value: 'ADMIN', label: 'Administrator' },
] as const;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Oczekujący' },
  { value: 'APPROVED', label: 'Zatwierdzony' },
  { value: 'REJECTED', label: 'Odrzucony' },
] as const;

export default function AdminUsersPage() {
  const confirm = useConfirm();
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
  const [editMode, setEditMode] = useState<
    'approve' | 'change-status' | 'assign-apartment' | 'create-user' | null
  >(null);
  const latestUsersRequestId = useRef(0);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'TENANT',
    status: 'PENDING',
  });

  const fetchUsers = useCallback(async () => {
    const requestId = ++latestUsersRequestId.current;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filter === 'ADMINS') {
        params.append('role', 'ADMIN');
      } else if (filter !== 'ALL') {
        params.append('status', filter);
      }
      params.append('page', String(page));
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await fetch(`/api/admin/users?${params}`);
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
  }, [filter, page, debouncedSearch]);

  const fetchApartments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
        activeOnly: 'false',
      });

      const response = await fetch(`/api/admin/apartments?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Fetch all users to check apartment assignments (not filtered by status)
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

        // For new user approval (PENDING status), show only unassigned apartments
        if (selectedUser?.status === AccountStatus.PENDING) {
          const unassignedApartments = data.apartments.filter(
            (apt: Apartment) =>
              !allUsers.some((u: User) =>
                u.apartments?.some((a) => a.id === apt.id)
              )
          );
          setApartments(unassignedApartments);
        } else {
          // For existing users, show their apartments + unassigned apartments
          const currentUserApartmentIds =
            selectedUser?.apartments?.map((a) => a.id) || [];

          const availableApartments = data.apartments.filter(
            (apt: Apartment) =>
              currentUserApartmentIds.includes(apt.id) || // Include current user's apartments
              !allUsers.some(
                (u: User) =>
                  u.id !== selectedUser?.id && // Exclude apartments from other users
                  u.apartments?.some((a) => a.id === apt.id)
              )
          );
          setApartments(availableApartments);
        }
      }
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
    if (selectedUser) {
      fetchApartments();
      // Initialize with current apartments when opening dialog
      setSelectedApartments(
        selectedUser.apartments?.map((apt) => apt.id) || []
      );
    }
  }, [selectedUser, fetchApartments]);

  const handleUpdateUser = async (
    userId: string,
    status: AccountStatus,
    apartmentIds?: string[]
  ) => {
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
        setSelectedUser(null);
        setSelectedApartments([]);
        setEditMode(null);
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
  };

  const handleCreateUser = async () => {
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
        setNewUserData({
          email: '',
          password: '',
          name: '',
          role: 'TENANT',
          status: 'PENDING',
        });
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
  };

  // Check if apartment matches user's name or email
  const isApartmentMatchingUser = (apt: Apartment, user: User | null) => {
    if (!user) return false;

    const userName = user.name?.toLowerCase() || '';
    const userEmail = user.email?.toLowerCase() || '';
    const aptOwner = apt.owner?.toLowerCase() || '';
    const aptEmail = apt.email?.toLowerCase() || '';

    // Match if user name matches apartment owner or user email matches apartment email
    return (
      (userName && aptOwner && aptOwner.includes(userName)) ||
      (userName && aptOwner && userName.includes(aptOwner)) ||
      (userEmail && aptEmail && userEmail === aptEmail)
    );
  };

  const filteredApartments = apartments
    .filter((apt) => {
      if (apartmentSearch === '') return true;
      const search = apartmentSearch.toLowerCase();
      // Search by number, address, building, owner, email, externalOwnerId, externalApartmentId
      // Also search by full title: "address building/number"
      const fullTitle =
        `${apt.address || ''} ${apt.building || ''}/${apt.number || ''}`.toLowerCase();
      return (
        apt.number?.toLowerCase().includes(search) ||
        apt.address?.toLowerCase().includes(search) ||
        apt.building?.toLowerCase().includes(search) ||
        apt.owner?.toLowerCase().includes(search) ||
        apt.email?.toLowerCase().includes(search) ||
        apt.externalOwnerId?.toLowerCase().includes(search) ||
        apt.externalApartmentId?.toLowerCase().includes(search) ||
        fullTitle.includes(search)
      );
    })
    .sort((a, b) => {
      // Sort currently assigned apartments first
      const aSelected = selectedApartments.includes(a.id);
      const bSelected = selectedApartments.includes(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Then sort matching apartments (by name/email)
      const aMatches = isApartmentMatchingUser(a, selectedUser);
      const bMatches = isApartmentMatchingUser(b, selectedUser);

      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      // Then sort by building and number
      const buildingCompare = (a.building || '').localeCompare(
        b.building || '',
        undefined,
        { numeric: true, sensitivity: 'base' }
      );
      if (buildingCompare !== 0) return buildingCompare;
      return (a.number || '').localeCompare(b.number || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });

  const getStatusBadge = (status: AccountStatus) => {
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
  };

  const pendingCount = users.filter(
    (u) => u.status === AccountStatus.PENDING
  ).length;

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title="Użytkownicy"
        description={
          pendingCount > 0
            ? pendingCount === 1
              ? '1 konto oczekuje na zatwierdzenie'
              : pendingCount < 5
                ? `${pendingCount} konta oczekują na zatwierdzenie`
                : `${pendingCount} kont oczekuje na zatwierdzenie`
            : undefined
        }
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
                  setNewUserData({
                    email: '',
                    password: '',
                    name: '',
                    role: 'TENANT',
                    status: 'PENDING',
                  });
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
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{user.name || user.email}</CardTitle>
                    <CardDescription className="mt-1">
                      {user.email}
                    </CardDescription>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Zarejestrowano:{' '}
                      {new Date(user.createdAt).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {getStatusBadge(user.status)}
                </div>
              </CardHeader>
              <CardContent>
                {user.apartments && user.apartments.length > 0 && (
                  <div className="mb-4 rounded-lg bg-muted p-3">
                    <p className="mb-2 text-sm font-medium">
                      Przypisane mieszkania: {user.apartments.length}
                    </p>
                    <div className="space-y-1">
                      {user.apartments.map((apartment) => {
                        const sharePercent =
                          apartment.shareNumerator != null &&
                          apartment.shareDenominator != null &&
                          apartment.shareDenominator > 0
                            ? (
                                (apartment.shareNumerator /
                                  apartment.shareDenominator) *
                                100
                              ).toFixed(1) + '%'
                            : null;
                        return (
                          <div
                            key={apartment.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground"
                          >
                            <span className="font-medium text-foreground">
                              {apartment.address} {apartment.building}/
                              {apartment.number}
                            </span>
                            <span>
                              {apartment.postalCode} {apartment.city}
                            </span>
                            {sharePercent && <span>{sharePercent}</span>}
                            {!apartment.isActive && (
                              <span className="inline-flex items-center rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                                Nieaktywny
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Desktop: inline buttons */}
                <div className="hidden gap-2 sm:flex">
                  {user.status === AccountStatus.PENDING && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => {
                          setSelectedUser(user);
                          setEditMode('approve');
                        }}
                      >
                        <UserCheck className="mr-1 h-4 w-4" />
                        Zatwierdź
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleUpdateUser(user.id, 'REJECTED')}
                      >
                        <UserX className="mr-1 h-4 w-4" />
                        Odrzuć
                      </Button>
                    </>
                  )}
                  {user.status === AccountStatus.APPROVED && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => {
                          setSelectedUser(user);
                          setEditMode('assign-apartment');
                        }}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Mieszkania ({user.apartments?.length || 0})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => {
                          setSelectedUser(user);
                          setEditMode('change-status');
                        }}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Zmień status
                      </Button>
                    </>
                  )}
                  {user.status === AccountStatus.REJECTED && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => {
                        setSelectedUser(user);
                        setEditMode('change-status');
                      }}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Zmień status
                    </Button>
                  )}
                </div>

                {/* Mobile: kebab dropdown */}
                <div className="flex gap-2 sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        aria-label="Akcje"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.status === AccountStatus.PENDING && (
                        <>
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedUser(user);
                              setEditMode('approve');
                            }}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Zatwierdź
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() =>
                              handleUpdateUser(user.id, 'REJECTED')
                            }
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Odrzuć
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.status === AccountStatus.APPROVED && (
                        <>
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedUser(user);
                              setEditMode('assign-apartment');
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Mieszkania ({user.apartments?.length || 0})
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedUser(user);
                              setEditMode('change-status');
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Zmień status
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.status === AccountStatus.REJECTED && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedUser(user);
                            setEditMode('change-status');
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Zmień status
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Następna
          </Button>
        </div>
      )}

      {selectedUser && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="animate-scale-in max-h-[80vh] w-full max-w-2xl overflow-auto">
            <CardHeader>
              <CardTitle>
                {editMode === 'approve' && 'Zatwierdź konto'}
                {editMode === 'assign-apartment' && 'Przypisz mieszkanie'}
                {editMode === 'change-status' && 'Zmień status użytkownika'}
              </CardTitle>
              <CardDescription>
                {selectedUser.name || selectedUser.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(editMode === 'approve' || editMode === 'assign-apartment') && (
                <>
                  <div>
                    <Label htmlFor="apartment-search">
                      {editMode === 'approve'
                        ? 'Przypisz mieszkanie (opcjonalne)'
                        : 'Wybierz mieszkanie'}
                    </Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="apartment-search"
                        placeholder="Szukaj po numerze, adresie, właścicielu lub emailu..."
                        value={apartmentSearch}
                        onChange={(e) => setApartmentSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-2">
                    {filteredApartments.map((apt) => {
                      const isMatching = isApartmentMatchingUser(
                        apt,
                        selectedUser
                      );
                      return (
                        <label
                          key={apt.id}
                          htmlFor={`apt-${apt.id}`}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:bg-muted hover:scale-[1.02] ${
                            selectedApartments.includes(apt.id)
                              ? 'border-primary bg-primary/5'
                              : isMatching
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                : ''
                          }`}
                        >
                          <Checkbox
                            id={`apt-${apt.id}`}
                            checked={selectedApartments.includes(apt.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedApartments([
                                  ...selectedApartments,
                                  apt.id,
                                ]);
                              } else {
                                setSelectedApartments(
                                  selectedApartments.filter(
                                    (id) => id !== apt.id
                                  )
                                );
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {apt.address} {apt.building}/{apt.number}
                              </p>
                              {isMatching && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <Check className="h-3 w-3" />
                                  Dopasowanie
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {apt.postalCode} {apt.city} • Budynek:{' '}
                              {apt.building} • Właściciel: {apt.owner}
                            </p>
                            {apt.email && (
                              <p className="text-xs text-muted-foreground">
                                Email: {apt.email}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Procent:{' '}
                              {apt.shareNumerator &&
                              apt.shareDenominator &&
                              apt.shareDenominator > 0
                                ? (
                                    (apt.shareNumerator /
                                      apt.shareDenominator) *
                                    100
                                  ).toFixed(1)
                                : '-'}
                              % • ID: {apt.externalApartmentId} /{' '}
                              {apt.externalOwnerId}
                            </p>
                          </div>
                        </label>
                      );
                    })}

                    {filteredApartments.length === 0 && apartmentSearch && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Nie znaleziono mieszkań
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleUpdateUser(
                          selectedUser.id,
                          AccountStatus.APPROVED,
                          selectedApartments
                        )
                      }
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      {editMode === 'approve'
                        ? 'Zatwierdź'
                        : `Przypisz (${selectedApartments.length})`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedApartments([]);
                        setApartmentSearch('');
                        setEditMode(null);
                      }}
                      disabled={actionLoading}
                    >
                      Anuluj
                    </Button>
                  </div>
                </>
              )}

              {editMode === 'change-status' && (
                <>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Obecny status: {getStatusBadge(selectedUser.status)}
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant={
                          selectedUser.status === AccountStatus.APPROVED
                            ? 'default'
                            : 'outline'
                        }
                        className="w-full justify-start"
                        onClick={() =>
                          handleUpdateUser(
                            selectedUser.id,
                            AccountStatus.APPROVED,
                            selectedUser.apartments?.map((a) => a.id) || []
                          )
                        }
                        disabled={
                          actionLoading ||
                          selectedUser.status === AccountStatus.APPROVED
                        }
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Zatwierdzony
                      </Button>
                      <Button
                        variant={
                          selectedUser.status === AccountStatus.REJECTED
                            ? 'destructive'
                            : 'outline'
                        }
                        className="w-full justify-start"
                        onClick={async () => {
                          if (
                            selectedUser.apartments &&
                            selectedUser.apartments.length > 0
                          ) {
                            const confirmed = await confirm({
                              title: 'Odrzuć użytkownika',
                              description:
                                'Odrzucenie użytkownika usunie przypisanie mieszkań. Kontynuować?',
                              confirmText: 'Odrzuć',
                              cancelText: 'Anuluj',
                              variant: 'destructive',
                            });
                            if (confirmed) {
                              handleUpdateUser(
                                selectedUser.id,
                                AccountStatus.REJECTED
                              );
                            }
                          } else {
                            handleUpdateUser(
                              selectedUser.id,
                              AccountStatus.REJECTED
                            );
                          }
                        }}
                        disabled={
                          actionLoading ||
                          selectedUser.status === AccountStatus.REJECTED
                        }
                      >
                        <X className="mr-2 h-4 w-4" />
                        Odrzucony
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        setEditMode(null);
                      }}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      Anuluj
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create User Dialog */}
      {editMode === 'create-user' && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="animate-scale-in w-full max-w-md">
            <CardHeader>
              <CardTitle>Dodaj nowego użytkownika</CardTitle>
              <CardDescription>
                Wypełnij formularz aby utworzyć nowe konto użytkownika
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={newUserData.email}
                    onChange={(e) =>
                      setNewUserData({
                        ...newUserData,
                        email: e.target.value,
                      })
                    }
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Hasło *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Hasło"
                    value={newUserData.password}
                    onChange={(e) =>
                      setNewUserData({
                        ...newUserData,
                        password: e.target.value,
                      })
                    }
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Imię i nazwisko</Label>
                  <Input
                    id="name"
                    placeholder="Jan Kowalski"
                    value={newUserData.name}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rola</Label>
                  <Select
                    id="role"
                    value={newUserData.role}
                    options={ROLE_OPTIONS}
                    onValueChange={(role) =>
                      setNewUserData({ ...newUserData, role })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={newUserData.status}
                    options={STATUS_OPTIONS}
                    onValueChange={(status) =>
                      setNewUserData({
                        ...newUserData,
                        status,
                      })
                    }
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreateUser}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Utwórz
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(null);
                      setNewUserData({
                        email: '',
                        password: '',
                        name: '',
                        role: 'TENANT',
                        status: 'PENDING',
                      });
                    }}
                    disabled={actionLoading}
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Page>
  );
}
