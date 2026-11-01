'use client';

import type { AccountPreview } from '@/app/admin/users/management/account-previews';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmCreateDialogProps {
  previews: AccountPreview[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmCreateDialog({
  previews,
  onCancel,
  onConfirm,
}: ConfirmCreateDialogProps) {
  return (
    <Dialog
      open={previews !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Potwierdź tworzenie kont</DialogTitle>
          <DialogDescription>
            Zostanie utworzonych <strong>{previews?.length ?? 0}</strong> nowych
            kont. Każde konto otrzyma e-mail z tymczasowym hasłem.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto rounded-md border text-sm">
          {previews?.map((preview) => (
            <div key={preview.email} className="border-b p-3 last:border-0">
              <p className="font-medium">{preview.email}</p>
              {preview.owner && (
                <p className="text-muted-foreground">{preview.owner}</p>
              )}
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {preview.apartments.map((apt) => (
                  <li key={apt.id}>
                    {apt.building ? `Bud. ${apt.building}, ` : ''}Mieszkanie{' '}
                    {apt.number}
                    {!apt.isActive && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        (nieaktywne)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Anuluj</Button>
          </DialogClose>
          <Button onClick={onConfirm}>Potwierdź i utwórz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
