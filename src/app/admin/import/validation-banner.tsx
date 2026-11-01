import { AlertTriangle, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ImportResponse } from '@/app/admin/import/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SuccessMessage } from '@/components/ui/success-message';

function WarningMessage({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg bg-orange-100 p-4 text-orange-900 dark:bg-orange-950 dark:text-orange-200"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 font-medium">{children}</p>
    </div>
  );
}

export function ValidationBanner({ response }: { response: ImportResponse }) {
  const failedHoas = response.results.filter(({ errors }) => errors.length > 0);
  const errorCount =
    failedHoas.reduce((sum, { errors }) => sum + errors.length, 0) +
    response.errors.length;
  const warningCount = response.results.reduce(
    (sum, { warnings }) => sum + warnings.length,
    0
  );
  const mismatchCount = response.results.reduce(
    (sum, { yearBalances = [] }) =>
      sum +
      yearBalances.filter(({ closingMismatch }) => closingMismatch).length,
    0
  );

  if (response.fullValidationSkipped) {
    if (mismatchCount > 0) {
      return (
        <WarningMessage>
          Pełna walidacja pominięta — salda lat z rozbieżnościami:{' '}
          {mismatchCount}
        </WarningMessage>
      );
    }

    return (
      <SuccessMessage>
        Pełna walidacja pominięta — salda lat są zgodne
      </SuccessMessage>
    );
  }

  if (errorCount > 0) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Walidacja nie powiodła się</AlertTitle>
        <AlertDescription>
          Błędy: {errorCount}, wspólnoty z błędami: {failedHoas.length}
        </AlertDescription>
      </Alert>
    );
  }

  if (warningCount > 0 || mismatchCount > 0) {
    return (
      <WarningMessage>
        Walidacja z uwagami — ostrzeżenia: {warningCount}, rozbieżności sald:{' '}
        {mismatchCount}
      </WarningMessage>
    );
  }

  return (
    <SuccessMessage>
      Walidacja zakończona pomyślnie — nie znaleziono błędów ani ostrzeżeń
    </SuccessMessage>
  );
}
