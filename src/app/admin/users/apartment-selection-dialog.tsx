import { Check, Search, X } from 'lucide-react';

import type { Apartment, EditMode, User } from '@/app/admin/users/types';
import { UserStatusBadge } from '@/app/admin/users/user-status-badge';
import {
  getApartmentSharePercent,
  isApartmentMatchingUser,
} from '@/app/admin/users/utils';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccountStatus } from '@/lib/types';

interface ApartmentSelectionDialogProps {
  actionLoading: boolean;
  apartmentSearch: string;
  editMode: EditMode;
  filteredApartments: Apartment[];
  onApartmentSearchChange: (value: string) => void;
  onApproveOrAssign: () => void;
  onCancel: () => void;
  onReject: () => void;
  onSelectApartment: (apartmentId: string, checked: boolean) => void;
  onSetApproved: () => void;
  open: boolean;
  selectedApartments: string[];
  selectedUser: User | null;
}

export function ApartmentSelectionDialog({
  actionLoading,
  apartmentSearch,
  editMode,
  filteredApartments,
  onApartmentSearchChange,
  onApproveOrAssign,
  onCancel,
  onReject,
  onSelectApartment,
  onSetApproved,
  open,
  selectedApartments,
  selectedUser,
}: ApartmentSelectionDialogProps) {
  const confirm = useConfirm();

  if (!open || !selectedUser) {
    return null;
  }

  const isApprovalMode =
    editMode === 'approve' || editMode === 'assign-apartment';

  async function handleApartmentCheckedChange(
    apartment: Apartment,
    checked: boolean
  ) {
    if (
      !checked ||
      apartment.isActive ||
      selectedApartments.includes(apartment.id)
    ) {
      onSelectApartment(apartment.id, checked);
      return;
    }

    const confirmed = await confirm({
      title: 'Nieaktywne mieszkanie',
      description:
        'To mieszkanie jest oznaczone jako nieaktywne. Czy na pewno chcesz je przypisać do użytkownika?',
      confirmText: 'Tak, przypisz',
      cancelText: 'Anuluj',
    });

    if (confirmed) {
      onSelectApartment(apartment.id, true);
    }
  }

  return (
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
          {isApprovalMode && (
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
                    onChange={(e) => onApartmentSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-2">
                {filteredApartments.map((apartment) => {
                  const isMatching = isApartmentMatchingUser(
                    apartment,
                    selectedUser
                  );
                  const sharePercent = getApartmentSharePercent(apartment);

                  return (
                    <label
                      key={apartment.id}
                      htmlFor={`apt-${apartment.id}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:bg-muted hover:scale-[1.02] ${
                        selectedApartments.includes(apartment.id)
                          ? 'border-primary bg-primary/5'
                          : isMatching
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : !apartment.isActive
                              ? 'opacity-60'
                              : ''
                      }`}
                    >
                      <Checkbox
                        id={`apt-${apartment.id}`}
                        checked={selectedApartments.includes(apartment.id)}
                        onCheckedChange={(checked: boolean) => {
                          void handleApartmentCheckedChange(apartment, checked);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {apartment.address} {apartment.building}/
                            {apartment.number}
                          </p>
                          {!apartment.isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Nieaktywny
                            </span>
                          )}
                          {isMatching && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              <Check className="h-3 w-3" />
                              Dopasowanie
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {apartment.postalCode} {apartment.city} • Budynek:{' '}
                          {apartment.building} • Właściciel: {apartment.owner}
                        </p>
                        {apartment.email && (
                          <p className="text-xs text-muted-foreground">
                            Email: {apartment.email}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Procent: {sharePercent ?? '-'} • ID:{' '}
                          {apartment.externalApartmentId} /{' '}
                          {apartment.externalOwnerId}
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
                  onClick={onApproveOrAssign}
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
                  onClick={onCancel}
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
                  Obecny status:{' '}
                  <UserStatusBadge status={selectedUser.status} />
                </p>
                <div className="space-y-2">
                  <Button
                    variant={
                      selectedUser.status === AccountStatus.APPROVED
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={onSetApproved}
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
                    onClick={onReject}
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
                  onClick={onCancel}
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
  );
}
