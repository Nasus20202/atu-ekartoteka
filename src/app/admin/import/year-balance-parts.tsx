import type { ImportResult } from '@/app/admin/import/types';
import type { YearBalanceRow } from '@/lib/import/types';
import { formatCurrency } from '@/lib/utils';

export const EMPTY_VALUE = '—';
export const MISMATCH_MARKER = '≠';
const ZERO_AMOUNT = '0.00';
const MISMATCH_LABEL = 'nie zgadza się z otwarciem roku następnego';
const OK_LABEL = 'OK';
const ERROR_LABEL = 'Błąd';

export function ValidationBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
      {OK_LABEL}
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
      {ERROR_LABEL}
    </span>
  );
}

export function MismatchNote({ next }: { next: YearBalanceRow }) {
  return (
    <>
      <span aria-hidden="true" className="ml-1">
        {MISMATCH_MARKER}
      </span>
      <span className="sr-only"> {MISMATCH_LABEL}</span>
      <span className="block text-xs">
        otwarcie {next.year}: {formatCurrency(next.openingBalance)}
      </span>
    </>
  );
}

export function collectYears(results: ImportResult[]): number[] {
  const years = new Set<number>();
  for (const { yearBalances = [] } of results) {
    for (const { year } of yearBalances) {
      years.add(year);
    }
  }
  return [...years].sort((a, b) => b - a);
}

export function hasRedValue(row: YearBalanceRow): boolean {
  return row.status === 'error' || row.closingMismatch;
}

export function hasNewRecords(row: YearBalanceRow): boolean {
  return row.newRecordsOpening !== ZERO_AMOUNT;
}
