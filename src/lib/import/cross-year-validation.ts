import {
  CLOSING_BALANCE_IGNORED_NOTE,
  WPLATY_BALANCE_TOLERANCE,
} from '@/lib/import/constants';
import type { ImportWarning, TransactionClient } from '@/lib/import/types';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';

const DECEMBER_MONTH_INDEX = 11;
const LAST_DAY_OF_DECEMBER = 31;
// Stored dates may shift by the server timezone offset; partial exports end by 30 November
const YEAR_END_TOLERANCE_MS = 24 * 60 * 60 * 1000;

type CrossYearPaymentEntry = {
  externalId: string;
  apartmentCode: string;
  year: number;
  openingBalance: DecimalLike;
};

type CrossYearTransactionClient = Pick<TransactionClient, 'payment'>;

/** Earliest period end that still counts as covering the whole year. */
export function fullYearEndThreshold(year: number): Date {
  const yearEnd = new Date(year, DECEMBER_MONTH_INDEX, LAST_DAY_OF_DECEMBER);
  return new Date(yearEnd.getTime() - YEAR_END_TOLERANCE_MS);
}

function coversFullYear(dateTo: Date, year: number): boolean {
  return dateTo.getTime() >= fullYearEndThreshold(year).getTime();
}

/**
 * Warns when the opening balance of a year differs from the closing balance
 * stored from the files for the previous, complete year. The imported closing
 * balances of closed years are unreliable, so this never blocks an import.
 */
export async function validateCrossYearBalances(
  tx: CrossYearTransactionClient,
  apartmentMap: Map<string, string>,
  entries: CrossYearPaymentEntry[],
  warnings: ImportWarning[]
): Promise<void> {
  for (const entry of entries) {
    const prevYear = entry.year - 1;
    const apartmentId = apartmentMap.get(
      `${entry.externalId}#${entry.apartmentCode}`
    );
    if (!apartmentId) continue;

    const prevPayment = await tx.payment.findFirst({
      where: { apartmentId, year: prevYear },
      select: { legacyClosingBalance: true, dateTo: true },
    });

    // A partial previous year has no year-end balance to compare against
    if (!prevPayment || !coversFullYear(prevPayment.dateTo, prevYear)) {
      continue;
    }

    const difference = toDecimal(entry.openingBalance).minus(
      toDecimal(prevPayment.legacyClosingBalance)
    );
    if (difference.abs().greaterThan(WPLATY_BALANCE_TOLERANCE)) {
      warnings.push({
        kind: 'opening-balance-file',
        apartmentExternalId: entry.apartmentCode,
        year: entry.year,
        difference: difference.abs().toFixed(4),
        message:
          `Lokal ${entry.apartmentCode}, rok ${entry.year}: saldo otwarcia ${entry.openingBalance} ≠ ` +
          `saldo zamknięcia roku ${prevYear} z pliku ${prevPayment.legacyClosingBalance}. ` +
          CLOSING_BALANCE_IGNORED_NOTE,
      });
    }
  }
}
