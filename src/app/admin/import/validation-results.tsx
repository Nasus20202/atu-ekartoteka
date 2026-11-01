import { ChevronDown, Download, XCircle } from 'lucide-react';

import { groupErrors } from '@/app/admin/import/error-groups';
import { GroupedIssues } from '@/app/admin/import/grouped-issues';
import { ImportWarnings } from '@/app/admin/import/import-warnings';
import type { ImportResponse, ImportResult } from '@/app/admin/import/types';
import { ValidationBanner } from '@/app/admin/import/validation-banner';
import { YearBalanceGrid } from '@/app/admin/import/year-balance-grid';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { downloadTextFile } from '@/lib/utils/download-file';
import { serialiseErrorsToTxt } from '@/lib/utils/export-errors';

const VALIDATION_EXPORT_FILE = 'walidacja-bazy.txt';
const YEAR_TO_YEAR_MARKER = 'saldo otwarcia';

const LEGEND =
  'Błąd oznacza, że import plików tej wspólnoty zostałby przerwany. Ostrzeżenie nie blokuje importu, ale warto sprawdzić dane.';
const YEAR_TO_YEAR_HINT =
  'Saldo otwarcia roku nie zgadza się z saldem zamknięcia poprzedniego roku. W plikach zamkniętych lat saldo zamknięcia pomija wyrównania zaliczek, więc różnice względem wartości z plików są spodziewane. Aplikacja pokazuje saldo wyliczone z naliczeń.';

function HoaFindings({ result }: { result: ImportResult }) {
  const hasYearToYearWarning = result.warnings.some(({ message }) =>
    message.includes(YEAR_TO_YEAR_MARKER)
  );

  return (
    <CollapsibleContent>
      <div className="space-y-3 px-4 pb-4">
        {result.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 dark:border-red-800 dark:bg-red-950">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive dark:text-red-300">
              <XCircle className="h-4 w-4" />
              Błędy ({result.errors.length})
            </div>
            <GroupedIssues
              groups={groupErrors(result.errors)}
              tone="error"
              formatItem={({ message }) => message}
            />
          </div>
        )}
        {hasYearToYearWarning && (
          <p className="text-sm text-muted-foreground">{YEAR_TO_YEAR_HINT}</p>
        )}
        <ImportWarnings warnings={result.warnings} />
      </div>
    </CollapsibleContent>
  );
}

function HoaSection({ result }: { result: ImportResult }) {
  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
        <span className="font-semibold">Wspólnota: {result.hoaId}</span>
        <span className="ml-auto flex items-center gap-2 text-xs font-medium">
          {result.errors.length > 0 && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive dark:text-red-300">
              Błędy: {result.errors.length}
            </span>
          )}
          {result.warnings.length > 0 && (
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-700 dark:text-orange-300">
              Ostrzeżenia: {result.warnings.length}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className="h-4 w-4 shrink-0 transition-transform duration-200"
        />
      </CollapsibleTrigger>
      <HoaFindings result={result} />
    </Collapsible>
  );
}

export function ValidationResults({ response }: { response: ImportResponse }) {
  const findings = response.results.filter(
    (result) => result.errors.length > 0 || result.warnings.length > 0
  );

  return (
    <div className="space-y-6">
      <ValidationBanner response={response} />
      <YearBalanceGrid results={response.results} />

      {findings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">{LEGEND}</p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                const content = serialiseErrorsToTxt(
                  findings.map(({ hoaId, errors, warnings }) => ({
                    hoaId,
                    errors,
                    warnings,
                  }))
                );
                downloadTextFile(content, VALIDATION_EXPORT_FILE);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Pobierz wyniki
            </Button>
          </div>

          {findings.map((result) => (
            <HoaSection key={result.hoaId} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
