'use client';

import {
  AlertCircle,
  Check,
  Clock,
  Edit,
  Search,
  UserCheck,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccountStatus, Apartment, UserWithApartment } from '@/lib/types';

type User = UserWithApartment;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | AccountStatus>('PENDING');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<string>('');
  const [apartmentSearch, setApartmentSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState<
    'approve' | 'change-status' | 'assign-apartment' | null
  >(null);

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
        // Filter out apartments that are already assigned
        const availableApartments = data.apartments.filter(
          (apt: Apartment) => !users.some((u) => u.apartment?.id === apt.id)
        );
        setApartments(availableApartments);
      }
    } catch (error) {
      console.error('Failed to fetch apartments:', error);
    }
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedUser) {
      fetchApartments();
    }
  }, [selectedUser, fetchApartments]);

  const handleUpdateUser = async (
    userId: string,
    status: AccountStatus,
    apartmentId?: string
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
          apartmentId,
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setSelectedUser(null);
        setSelectedApartment('');
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

  const handleRemoveApartment = async (
    userId: string,
    currentStatus: AccountStatus
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
          status: currentStatus,
          apartmentId: null,
        }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove apartment');
      }
    } catch (error) {
      console.error('Failed to remove apartment:', error);
      alert('Failed to remove apartment');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApartments = apartments.filter(
    (apt) =>
      apartmentSearch === '' ||
      apt.number.toLowerCase().includes(apartmentSearch.toLowerCase()) ||
      apt.address?.toLowerCase().includes(apartmentSearch.toLowerCase()) ||
      apt.owner?.toLowerCase().includes(apartmentSearch.toLowerCase())
  );

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
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Użytkownicy</h1>
            {pendingCount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingCount} kont oczekuje na zatwierdzenie
              </p>
            )}
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
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Brak użytkowników</p>
              <p className="text-sm text-muted-foreground">
                {filter === AccountStatus.PENDING
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
                  {user.apartment && (
                    <div className="mb-4 rounded-lg bg-muted p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="mb-1 text-sm font-medium">
                            Przypisane mieszkanie:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.apartment.address} {user.apartment.number}
                            <br />
                            {user.apartment.postalCode} {user.apartment.city}
                          </p>
                        </div>
                        {user.status === AccountStatus.APPROVED && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(
                                  'Czy na pewno chcesz usunąć przypisanie mieszkania?'
                                )
                              ) {
                                handleRemoveApartment(
                                  user.id,
                                  AccountStatus.APPROVED
                                );
                              }
                            }}
                            disabled={actionLoading}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {user.status === 'PENDING' && (
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

                    {user.status === 'APPROVED' && (
                      <>
                        {!user.apartment && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditMode('assign-apartment');
                            }}
                            disabled={actionLoading}
                          >
                            Przypisz mieszkanie
                          </Button>
                        )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="max-h-[80vh] w-full max-w-2xl overflow-auto">
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
                          placeholder="Szukaj po numerze, adresie lub właścicielu..."
                          value={apartmentSearch}
                          onChange={(e) => setApartmentSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-2">
                      {editMode === 'approve' && (
                        <button
                          type="button"
                          onClick={() => setSelectedApartment('')}
                          className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                            selectedApartment === ''
                              ? 'border-primary bg-primary/5'
                              : ''
                          }`}
                        >
                          <p className="text-sm font-medium">Brak mieszkania</p>
                          <p className="text-xs text-muted-foreground">
                            Zatwierdź konto bez przypisywania mieszkania
                          </p>
                        </button>
                      )}

                      {filteredApartments.map((apt) => (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => setSelectedApartment(apt.id)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                            selectedApartment === apt.id
                              ? 'border-primary bg-primary/5'
                              : ''
                          }`}
                        >
                          <p className="text-sm font-medium">
                            {apt.address} {apt.number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.postalCode} {apt.city} • Budynek:{' '}
                            {apt.building} • Właściciel: {apt.owner}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Powierzchnia: {apt.area} m² • ID: {apt.externalId}
                          </p>
                        </button>
                      ))}

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
                            selectedApartment || undefined
                          )
                        }
                        disabled={
                          actionLoading ||
                          (editMode === 'assign-apartment' &&
                            !selectedApartment)
                        }
                        className="flex-1"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {editMode === 'approve' ? 'Zatwierdź' : 'Przypisz'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(null);
                          setSelectedApartment('');
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
                            selectedUser.status === 'APPROVED'
                              ? 'default'
                              : 'outline'
                          }
                          className="w-full justify-start"
                          onClick={() =>
                            handleUpdateUser(
                              selectedUser.id,
                              'APPROVED',
                              selectedUser.apartment?.id
                            )
                          }
                          disabled={
                            actionLoading || selectedUser.status === 'APPROVED'
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
                          onClick={() => {
                            if (selectedUser.apartment) {
                              if (
                                confirm(
                                  'Odrzucenie użytkownika usunie przypisanie mieszkania. Kontynuować?'
                                )
                              ) {
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
      </div>
    </div>
  );
}
