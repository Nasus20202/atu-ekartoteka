import { AlertCircle, CheckCircle, Download, XCircle } from 'lucide-react';

import { ImportResultCard } from '@/app/admin/import/import-result-card';
import type { ImportResponse } from '@/app/admin/import/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { serialiseErrorsToTxt } from '@/lib/utils/export-errors';

interface ImportResultsProps {
  response: ImportResponse | null;
}

export function ImportResults({ response }: ImportResultsProps) {
  if (!response) {
    return null;
  }

  const failedHoas = response.results.filter(
    (result) => result.errors.length > 0
  );
  const hasAnyErrors = response.results.some(
    (result) => result.errors.length > 0 || result.warnings.length > 0
  );

  return (
    <div className="space-y-4">
      {failedHoas.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Wspólnoty z błędami ({failedHoas.length})</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1">
              {failedHoas.map((result) => (
                <li key={result.hoaId}>
                  • <span className="font-medium">{result.hoaId}</span>:{' '}
                  {result.errors[0]}
                  {result.errors.length > 1 &&
                    ` (+${result.errors.length - 1} więcej)`}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {response.success && (
        <div className="flex items-start gap-2 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Import zakończony pomyślnie</p>
          </div>
        </div>
      )}

      {response.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błędy plików ({response.errors.length})</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1">
              {response.errors.map((error, idx) => (
                <li key={idx}>
                  • {error.file || error.hoaId}: {error.error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {hasAnyErrors && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const entries = response.results
                .filter((r) => r.errors.length > 0 || r.warnings.length > 0)
                .map((r) => ({
                  hoaId: r.hoaId,
                  errors: r.errors,
                  warnings: r.warnings.map((w) => ({
                    apartmentExternalId: w.apartmentExternalId,
                    period: w.period,
                    message: w.message,
                  })),
                }));
              const content = serialiseErrorsToTxt(entries);
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'bledy-import.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Pobierz wszystkie błędy
          </Button>
        </div>
      )}

      {response.results.map((result) => (
        <ImportResultCard key={result.hoaId} result={result} />
      ))}
    </div>
  );
}
