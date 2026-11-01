import { Fragment } from 'react';

import type { ImportResult } from '@/app/admin/import/types';
import { YearBalanceCell } from '@/app/admin/import/year-balance-cell';
import {
  collectYears,
  EMPTY_VALUE,
  hasNewRecords,
  hasRedValue,
  MISMATCH_MARKER,
  MismatchNote,
  ValidationBadge,
} from '@/app/admin/import/year-balance-parts';
import { cn, formatCurrency } from '@/lib/utils';

const RED_CELL_CLASS = 'font-semibold text-destructive';
const STICKY_COLUMN_CLASS =
  'sticky left-0 text-left shadow-[1px_0_0_0_hsl(var(--border))]';

export function YearBalanceGrid({ results }: { results: ImportResult[] }) {
  const years = collectYears(results);
  const sortedRows = results.map((result) =>
    [...(result.yearBalances ?? [])].sort((a, b) => a.year - b.year)
  );
  const yearOk = (year: number) =>
    sortedRows.every((rows) =>
      rows.every((row) => row.year !== year || !hasRedValue(row))
    );

  return (
    <section className="space-y-3" aria-labelledby="year-balance-title">
      <div className="space-y-1">
        <h3 id="year-balance-title" className="font-semibold">
          Salda lat według wspólnot
        </h3>
        <p className="text-sm text-muted-foreground">
          Zamknięcie roku wyliczone z naliczeń, a obok otwarcie z importu roku
          następnego.{' '}
          <span className="font-medium text-destructive">Czerwone</span>{' '}
          wartości to błąd albo rozbieżność (
          <span className="text-destructive">{MISMATCH_MARKER}</span>) z rokiem
          następnym. Odznaka OK przy wspólnocie i roku oznacza brak czerwonych
          wartości. Kliknięcie wartości pokazuje lokale tej wspólnoty w danym
          roku.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="bg-muted">
              <th
                scope="col"
                rowSpan={2}
                className={cn(STICKY_COLUMN_CLASS, 'z-20 bg-muted px-3 py-2')}
              >
                Wspólnota
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  scope="colgroup"
                  colSpan={2}
                  className="border-l px-3 py-2 text-center"
                >
                  <span className="inline-flex items-center gap-2">
                    {year}
                    <ValidationBadge ok={yearOk(year)} />
                  </span>
                </th>
              ))}
            </tr>
            <tr className="bg-muted text-xs text-muted-foreground">
              {years.map((year) => (
                <Fragment key={year}>
                  <th scope="col" className="border-l px-3 py-1 text-right">
                    Zamknięcie
                  </th>
                  <th
                    scope="col"
                    className="border-l border-border/50 px-3 py-1 text-right"
                  >
                    Otwarcie
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result, resultIndex) => {
              const hoaName = result.hoaName ?? result.hoaId;
              const rows = sortedRows[resultIndex];
              const byYear = new Map(
                rows.map((row, index) => [
                  row.year,
                  { row, next: rows[index + 1] },
                ])
              );
              const hoaOk =
                result.errors.length === 0 && !rows.some(hasRedValue);

              return (
                <tr key={result.hoaId} className="border-t">
                  <th
                    scope="row"
                    className={cn(
                      STICKY_COLUMN_CLASS,
                      'z-10 bg-background px-3 py-2'
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 font-medium">
                      {hoaName}
                      <ValidationBadge ok={hoaOk} />
                    </span>
                  </th>
                  {years.map((year) => {
                    const entry = byYear.get(year);

                    if (!entry) {
                      return (
                        <Fragment key={year}>
                          <td className="border-l px-3 py-2 text-right text-muted-foreground">
                            {EMPTY_VALUE}
                          </td>
                          <td className="border-l border-border/50 px-3 py-2 text-right text-muted-foreground">
                            {EMPTY_VALUE}
                          </td>
                        </Fragment>
                      );
                    }

                    const { row, next } = entry;
                    const isError = row.status === 'error';
                    return (
                      <Fragment key={year}>
                        <YearBalanceCell
                          hoaName={hoaName}
                          row={row}
                          className={cn(
                            'border-l p-1 text-right tabular-nums',
                            (isError || row.closingMismatch) && RED_CELL_CLASS
                          )}
                        >
                          {formatCurrency(row.calculatedClosing)}
                          {row.closingMismatch && next && (
                            <MismatchNote next={next} />
                          )}
                        </YearBalanceCell>
                        <YearBalanceCell
                          hoaName={hoaName}
                          row={row}
                          className={cn(
                            'border-l border-border/50 p-1 text-right tabular-nums',
                            isError && RED_CELL_CLASS
                          )}
                        >
                          {formatCurrency(row.openingBalance)}
                          {hasNewRecords(row) && (
                            <span className="block text-xs text-amber-700 dark:text-amber-300">
                              w tym nowy właściciel:{' '}
                              {formatCurrency(row.newRecordsOpening)}
                            </span>
                          )}
                        </YearBalanceCell>
                      </Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
