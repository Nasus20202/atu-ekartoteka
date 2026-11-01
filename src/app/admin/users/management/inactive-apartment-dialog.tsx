'use client';

import { useState } from 'react';

import {
  aptLabel,
  type UnassignedApartment,
} from '@/app/admin/users/management/apartment-row';
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

type ConfirmStep = 'warning' | 'final';

interface InactiveApartmentDialogProps {
  apartment: UnassignedApartment | null;
  onConfirm: (apartment: UnassignedApartment) => void;
  onClose: () => void;
}

export function InactiveApartmentDialog({
  apartment,
  onConfirm,
  onClose,
}: InactiveApartmentDialogProps) {
  const [step, setStep] = useState<ConfirmStep>('warning');

  function close() {
    setStep('warning');
    onClose();
  }

  function handleContinue() {
    if (!apartment) return;
    if (step === 'warning') {
      setStep('final');
      return;
    }
    onConfirm(apartment);
    close();
  }

  return (
    <Dialog
      open={apartment !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'warning'
              ? 'Nieaktywne mieszkanie'
              : 'Potwierdź wybór nieaktywnego mieszkania'}
          </DialogTitle>
          <DialogDescription>
            {step === 'warning'
              ? 'To mieszkanie jest oznaczone jako nieaktywne. Czy na pewno chcesz uwzględnić je przy tworzeniu konta użytkownika?'
              : `${apartment ? aptLabel(apartment) : ''} zostanie zaznaczone mimo że jest nieaktywne. Potwierdź ponownie, aby kontynuować.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Anuluj</Button>
          </DialogClose>
          <Button onClick={handleContinue}>
            {step === 'warning' ? 'Kontynuuj' : 'Tak, zaznacz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
