import {
  EMPTY_VALUE,
  hasNewRecords,
} from '@/app/admin/import/year-balance-parts';
import type { YearBalanceRow, YearRecord } from '@/lib/import/types';
import { cn, formatCurrency } from '@/lib/utils';

const RECORD_STATUS_ORDER: Record<YearRecord['status'], number> = {
  mismatch: 0,
  ended: 1,
  match: 2,
  last: 3,
};
const MISMATCH_ROW_CLASS =
  'bg-red-100 font-semibold text-red-900 dark:bg-red-950 dark:text-red-200';
const NEW_OWNER_ROW_CLASS =
  'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-200';
const MISMATCH_NOTE = 'rozbieżność';
const ENDED_NOTE = 'brak w roku następnym';
const NEW_OWNER_NOTE = 'nowy właściciel';

function rowClassFor({ status, isNew }: YearRecord): string {
  if (status === 'mismatch') return MISMATCH_ROW_CLASS;
  return isNew ? NEW_OWNER_ROW_CLASS : '';
}

function noteFor({ status, isNew }: YearRecord): string {
  if (status === 'mismatch') return MISMATCH_NOTE;
  if (status === 'ended') return ENDED_NOTE;
  return isNew ? NEW_OWNER_NOTE : '';
}

export function YearBalanceDetails({
  hoaName,
  row,
}: {
  hoaName: string;
  row: YearBalanceRow;
}) {
  const records = [...row.records].sort(
    (a, b) => RECORD_STATUS_ORDER[a.status] - RECORD_STATUS_ORDER[b.status]
  );
  const mismatchCount = row.records.filter(
    ({ status }) => status === 'mismatch'
  ).length;

  return (
    <div className="space-y-2">
      <p className="font-semibold">
        {hoaName} · {row.year}
      </p>
      {mismatchCount > 0 && (
        <p className="font-medium text-destructive">
          Rozbieżności: {mismatchCount}
        </p>
      )}
      {hasNewRecords(row) && (
        <p className="font-medium text-amber-700 dark:text-amber-300">
          Nowy właściciel, saldo otwarcia:{' '}
          {formatCurrency(row.newRecordsOpening)}
        </p>
      )}
      {records.length === 0 ? (
        <p className="text-muted-foreground">Brak lokali w tym roku.</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-popover text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-1 text-left font-medium">
                  Lokal
                </th>
                <th scope="col" className="px-2 py-1 text-left font-medium">
                  Właściciel
                </th>
                <th scope="col" className="px-2 py-1 text-right font-medium">
                  Zamknięcie
                </th>
                <th scope="col" className="px-2 py-1 text-right font-medium">
                  Otwarcie następnego
                </th>
                <th scope="col" className="px-2 py-1 text-right font-medium">
                  Różnica
                </th>
                <th scope="col" className="px-2 py-1 text-left font-medium">
                  Uwaga
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={index} className={cn('border-t', rowClassFor(record))}>
                  <td className="px-2 py-1">{record.apartmentLabel}</td>
                  <td className="px-2 py-1">{record.ownerId}</td>
                  <td className="px-2 py-1 text-right tabular-nums">
                    {formatCurrency(record.closing)}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">
                    {record.nextOpening === null
                      ? EMPTY_VALUE
                      : formatCurrency(record.nextOpening)}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">
                    {record.difference === null
                      ? EMPTY_VALUE
                      : formatCurrency(record.difference)}
                  </td>
                  <td className="px-2 py-1">{noteFor(record)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
