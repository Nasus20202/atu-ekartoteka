'use client';

import {
  AlertCircle,
  Check,
  Clock,
  Edit,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useConfirm } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccountStatus, Apartment, UserWithApartments } from '@/lib/types';

type User = UserWithApartments;

export default function AdminUsersPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | AccountStatus>(
    AccountStatus.PENDING
  );
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [apartmentSearch, setApartmentSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState<
    'approve' | 'change-status' | 'assign-apartment' | 'create-user' | null
  >(null);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'TENANT',
    status: 'PENDING',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchApartments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
        activeOnly: 'true',
      });

      const response = await fetch(`/api/admin/apartments?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Fetch all users to check apartment assignments (not filtered by status)
        const allUsersResponse = await fetch('/api/admin/users');
        const allUsersData = await allUsersResponse.json();
        const allUsers = allUsersData.users || [];

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
    .filter(
      (apt) =>
        apartmentSearch === '' ||
        apt.number.toLowerCase().includes(apartmentSearch.toLowerCase()) ||
        apt.address?.toLowerCase().includes(apartmentSearch.toLowerCase()) ||
        apt.owner?.toLowerCase().includes(apartmentSearch.toLowerCase()) ||
        apt.email?.toLowerCase().includes(apartmentSearch.toLowerCase())
    )
    .sort((a, b) => {
      // Sort matching apartments first
      const aMatches = isApartmentMatchingUser(a, selectedUser);
      const bMatches = isApartmentMatchingUser(b, selectedUser);

      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      // Then sort by building and number
      const buildingCompare = (a.building || '').localeCompare(
        b.building || ''
      );
      if (buildingCompare !== 0) return buildingCompare;
      return (a.number || '').localeCompare(b.number || '');
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

  const filteredUsers = users.filter((user) => {
    if (userSearch === '') return true;

    const searchLower = userSearch.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(searchLower);
    const emailMatch = user.email?.toLowerCase().includes(searchLower);
    const apartmentMatch = user.apartments?.some(
      (apt) =>
        apt.number.toLowerCase().includes(searchLower) ||
        apt.address?.toLowerCase().includes(searchLower) ||
        apt.owner?.toLowerCase().includes(searchLower)
    );

    return nameMatch || emailMatch || apartmentMatch;
  });

  const pendingCount = users.filter(
    (u) => u.status === AccountStatus.PENDING
  ).length;

  return (
    <div className="min-h-screen bg-background p-8 animate-fade-in">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between animate-slide-in-top">
          <div>
            <h1 className="text-3xl font-bold">Użytkownicy</h1>
            {pendingCount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingCount} kont oczekuje na zatwierdzenie
              </p>
            )}
          </div>
          <Button
            onClick={() => {
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
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj po imieniu, emailu lub mieszkaniu..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            variant={filter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilter('ALL')}
            size="sm"
          >
            Wszyscy
          </Button>
          <Button
            variant={filter === AccountStatus.PENDING ? 'default' : 'outline'}
            onClick={() => setFilter(AccountStatus.PENDING)}
            size="sm"
          >
            <Clock className="mr-1 h-4 w-4" />
            Oczekujące
          </Button>
          <Button
            variant={filter === AccountStatus.APPROVED ? 'default' : 'outline'}
            onClick={() => setFilter(AccountStatus.APPROVED)}
            size="sm"
          >
            <Check className="mr-1 h-4 w-4" />
            Zatwierdzone
          </Button>
          <Button
            variant={filter === AccountStatus.REJECTED ? 'default' : 'outline'}
            onClick={() => setFilter(AccountStatus.REJECTED)}
            size="sm"
          >
            <X className="mr-1 h-4 w-4" />
            Odrzucone
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Ładowanie...</div>
        ) : filteredUsers.length === 0 ? (
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
            {filteredUsers.map((user, index) => (
              <Card
                key={user.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="mb-1 text-sm font-medium">
                            Przypisane mieszkania: {user.apartments.length}
                          </p>
                          <div className="space-y-2">
                            {user.apartments.map((apartment) => (
                              <p
                                key={apartment.id}
                                className="text-sm text-muted-foreground"
                              >
                                {apartment.address} {apartment.number}
                                <br />
                                {apartment.postalCode} {apartment.city}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {user.status === AccountStatus.PENDING && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditMode('approve');
                          }}
                          disabled={actionLoading}
                        >
                          <UserCheck className="mr-1 h-4 w-4" />
                          Zatwierdź
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateUser(user.id, 'REJECTED')}
                          disabled={actionLoading}
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
                          onClick={() => {
                            setSelectedUser(user);
                            setEditMode('assign-apartment');
                          }}
                          disabled={actionLoading}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Mieszkania ({user.apartments?.length || 0})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditMode('change-status');
                          }}
                          disabled={actionLoading}
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
                        onClick={() => {
                          setSelectedUser(user);
                          setEditMode('change-status');
                        }}
                        disabled={actionLoading}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Zmień status
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
            <Card className="max-h-[80vh] w-full max-w-2xl overflow-auto animate-scale-in">
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
                {(editMode === 'approve' ||
                  editMode === 'assign-apartment') && (
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
                                  {apt.address} {apt.number}
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
                                Powierzchnia: {apt.area ? apt.area / 100 : '-'}{' '}
                                m² • ID: {apt.externalId}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
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
                    <select
                      id="role"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newUserData.role}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, role: e.target.value })
                      }
                    >
                      <option value="TENANT">Użytkownik</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newUserData.status}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="PENDING">Oczekujący</option>
                      <option value="APPROVED">Zatwierdzony</option>
                      <option value="REJECTED">Odrzucony</option>
                    </select>
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
      </div>
    </div>
  );
}
