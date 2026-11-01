import { UserPlus } from 'lucide-react';

import { ROLE_OPTIONS, STATUS_OPTIONS } from '@/app/admin/users/constants';
import type { NewUserFormData } from '@/app/admin/users/types';
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
import { Select } from '@/components/ui/select';
import type { AccountStatus, UserRole } from '@/lib/types';

interface CreateUserDialogProps {
  actionLoading: boolean;
  newUserData: NewUserFormData;
  onCancel: () => void;
  onChange: (data: NewUserFormData) => void;
  onSubmit: () => void;
  open: boolean;
}

export function CreateUserDialog({
  actionLoading,
  newUserData,
  onCancel,
  onChange,
  onSubmit,
  open,
}: CreateUserDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent className="max-w-md gap-0 p-0">
        <CardHeader>
          <DialogTitle asChild>
            <CardTitle>Dodaj nowego użytkownika</CardTitle>
          </DialogTitle>
          <DialogDescription asChild>
            <CardDescription>
              Wypełnij formularz aby utworzyć nowe konto użytkownika
            </CardDescription>
          </DialogDescription>
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
                  onChange({
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
                  onChange({
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
                  onChange({ ...newUserData, name: e.target.value })
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
                  onChange({ ...newUserData, role: role as UserRole })
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
                  onChange({ ...newUserData, status: status as AccountStatus })
                }
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={onSubmit}
                disabled={actionLoading}
                className="flex-1"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Utwórz
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={actionLoading}
              >
                Anuluj
              </Button>
            </div>
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}
