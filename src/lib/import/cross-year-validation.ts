import { WPLATY_BALANCE_TOLERANCE } from '@/lib/import/constants';
import type { TransactionClient } from '@/lib/import/types';
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

function coversFullYear(dateTo: Date, year: number): boolean {
  const yearEnd = new Date(year, DECEMBER_MONTH_INDEX, LAST_DAY_OF_DECEMBER);
  return dateTo.getTime() >= yearEnd.getTime() - YEAR_END_TOLERANCE_MS;
}

export async function validateCrossYearBalances(
  tx: CrossYearTransactionClient,
  apartmentMap: Map<string, string>,
  entries: CrossYearPaymentEntry[],
  errors: string[]
): Promise<void> {
  let mismatches = 0;

  for (const entry of entries) {
    const prevYear = entry.year - 1;
    const apartmentId = apartmentMap.get(
      `${entry.externalId}#${entry.apartmentCode}`
    );
    if (!apartmentId) continue;

    const prevPayment = await tx.payment.findFirst({
      where: { apartmentId, year: prevYear },
      select: { closingBalance: true, dateTo: true },
    });

    // A partial previous year has no year-end balance to compare against
    if (!prevPayment || !coversFullYear(prevPayment.dateTo, prevYear)) {
      continue;
    }

    const diff = toDecimal(entry.openingBalance)
      .minus(toDecimal(prevPayment.closingBalance))
      .abs();
    if (diff.greaterThan(WPLATY_BALANCE_TOLERANCE)) {
      errors.push(
        `Lokal ${entry.apartmentCode}, rok ${entry.year}: saldo otwarcia ${entry.openingBalance} ≠ saldo zamknięcia ${prevPayment.closingBalance} roku ${prevYear}`
      );
      mismatches++;
    }
  }

  if (mismatches > 0) {
    throw new Error(
      `Niezgodność sald otwarcia z zamknięciem poprzedniego roku: ${mismatches} lokal(e)`
    );
  }
}
