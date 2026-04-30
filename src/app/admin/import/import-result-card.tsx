import { XCircle } from 'lucide-react';

import { ImportWarnings } from '@/app/admin/import/import-warnings';
import type { EntityStats, ImportResult } from '@/app/admin/import/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImportResultCardProps {
  result: ImportResult;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pl-PL');
}

function EntityStatsSection({
  stats,
  title,
  thirdLabel,
  thirdValueClassName,
  thirdValue,
}: {
  stats: EntityStats;
  title: string;
  thirdLabel: string;
  thirdValueClassName: string;
  thirdValue: number;
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.created}
          </div>
          <p className="text-sm text-muted-foreground">Utworzonych</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.updated}
          </div>
          <p className="text-sm text-muted-foreground">Zaktualizowanych</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className={thirdValueClassName}>{thirdValue}</div>
          <p className="text-sm text-muted-foreground">{thirdLabel}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Razem w pliku</p>
        </div>
      </div>
    </div>
  );
}

export function ImportResultCard({ result }: ImportResultCardProps) {
  return (
    <Card
      className={
        result.errors.length > 0
          ? 'border-destructive/50 dark:border-red-800'
          : ''
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {result.errors.length > 0 && (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          Wspólnota: {result.hoaId}
        </CardTitle>
        {(result.apartmentsDataDate ||
          result.chargesDataDate ||
          result.notificationsDataDate) && (
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {result.apartmentsDataDate && (
              <span>Mieszkania: {formatDate(result.apartmentsDataDate)}</span>
            )}
            {result.chargesDataDate && (
              <span>Naliczenia: {formatDate(result.chargesDataDate)}</span>
            )}
            {result.notificationsDataDate && (
              <span>
                Powiadomienia: {formatDate(result.notificationsDataDate)}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <EntityStatsSection
          stats={result.apartments}
          title="Mieszkania"
          thirdLabel="Dezaktywowanych"
          thirdValue={result.apartments.deleted}
          thirdValueClassName="text-2xl font-bold text-orange-600 dark:text-orange-400"
        />

        {result.charges && (
          <EntityStatsSection
            stats={result.charges}
            title="Naliczenia"
            thirdLabel="Pominiętych"
            thirdValue={result.charges.skipped}
            thirdValueClassName="text-2xl font-bold text-yellow-600 dark:text-yellow-400"
          />
        )}

        {result.notifications && (
          <EntityStatsSection
            stats={result.notifications}
            title="Powiadomienia o opłatach"
            thirdLabel="Usuniętych"
            thirdValue={result.notifications.deleted}
            thirdValueClassName="text-2xl font-bold text-red-600 dark:text-red-400"
          />
        )}

        {result.payments && (
          <EntityStatsSection
            stats={result.payments}
            title="Wpłaty"
            thirdLabel="Pominiętych"
            thirdValue={result.payments.skipped}
            thirdValueClassName="text-2xl font-bold text-yellow-600 dark:text-yellow-400"
          />
        )}

        {result.errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 dark:border-red-800 dark:bg-red-950">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive dark:text-red-300">
              <XCircle className="h-4 w-4" />
              Błędy walidacji ({result.errors.length}) — wspólnota nie została
              zaimportowana
            </div>
            <ul className="space-y-1 text-sm text-destructive/80 dark:text-red-400">
              {result.errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <ImportWarnings warnings={result.warnings} />
      </CardContent>
    </Card>
  );
}
