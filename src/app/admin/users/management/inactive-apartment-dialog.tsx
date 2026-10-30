'use client';

import { useState } from 'react';

import {
  aptLabel,
  type UnassignedApartment,
} from '@/app/admin/users/management/apartment-row';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

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
    <AlertDialog
      open={apartment !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === 'warning'
              ? 'Nieaktywne mieszkanie'
              : 'Potwierdź wybór nieaktywnego mieszkania'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === 'warning'
              ? 'To mieszkanie jest oznaczone jako nieaktywne. Czy na pewno chcesz uwzględnić je przy tworzeniu konta użytkownika?'
              : `${apartment ? aptLabel(apartment) : ''} zostanie zaznaczone mimo że jest nieaktywne. Potwierdź ponownie, aby kontynuować.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <Button onClick={handleContinue}>
            {step === 'warning' ? 'Kontynuuj' : 'Tak, zaznacz'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
