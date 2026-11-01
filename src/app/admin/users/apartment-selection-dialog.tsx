import { Check, Search } from 'lucide-react';

import { ApartmentOption } from '@/app/admin/users/apartment-option';
import { StatusChangePanel } from '@/app/admin/users/status-change-panel';
import type { EditMode } from '@/app/admin/users/types';
import { isApartmentMatchingUser } from '@/app/admin/users/utils';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRetainedValue } from '@/hooks/use-retained-value';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

interface ApartmentSelectionDialogProps {
  actionLoading: boolean;
  apartmentSearch: string;
  editMode: EditMode;
  filteredApartments: ApartmentSummaryDto[];
  onApartmentSearchChange: (value: string) => void;
  onApproveOrAssign: () => void;
  onCancel: () => void;
  onReject: () => void;
  onSelectApartment: (apartmentId: string, checked: boolean) => void;
  onSetApproved: () => void;
  open: boolean;
  selectedApartments: string[];
  selectedUser: UserDto | null;
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
  // The parent clears the user and mode on close; keep them while the dialog animates out
  const user = useRetainedValue(selectedUser);
  const mode = useRetainedValue(editMode);

  if (!user) {
    return null;
  }

  const isApprovalMode = mode === 'approve' || mode === 'assign-apartment';

  async function handleApartmentCheckedChange(
    apartment: ApartmentSummaryDto,
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
    <Dialog
      open={open && selectedUser !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent className="max-h-[80vh] max-w-2xl gap-0 overflow-auto p-0">
        <CardHeader>
          <DialogTitle asChild>
            <CardTitle>
              {mode === 'approve' && 'Zatwierdź konto'}
              {mode === 'assign-apartment' && 'Przypisz mieszkanie'}
              {mode === 'change-status' && 'Zmień status użytkownika'}
            </CardTitle>
          </DialogTitle>
          <DialogDescription asChild>
            <CardDescription>{user.name || user.email}</CardDescription>
          </DialogDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isApprovalMode && (
            <>
              <div>
                <Label htmlFor="apartment-search">
                  {mode === 'approve'
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
                {filteredApartments.map((apartment) => (
                  <ApartmentOption
                    key={apartment.id}
                    apartment={apartment}
                    selected={selectedApartments.includes(apartment.id)}
                    matching={isApartmentMatchingUser(apartment, user)}
                    onCheckedChange={(checked) => {
                      void handleApartmentCheckedChange(apartment, checked);
                    }}
                  />
                ))}

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
                  {mode === 'approve'
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

          {mode === 'change-status' && (
            <StatusChangePanel
              status={user.status}
              actionLoading={actionLoading}
              onSetApproved={onSetApproved}
              onReject={onReject}
              onCancel={onCancel}
            />
          )}
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}
