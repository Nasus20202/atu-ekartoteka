import { WPLATY_BALANCE_TOLERANCE } from '@/lib/import/constants';
import { fullYearEndThreshold } from '@/lib/import/cross-year-validation';
import type { ImportWarning, TransactionClient } from '@/lib/import/types';
import { findMonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { applyDerivedFigures } from '@/lib/utils/payment-balances';
import { PAYMENT_MONTH_FIELD_KEYS } from '@/lib/utils/payment-months';
import { yearEndPeriod, yearStartPeriod } from '@/lib/utils/period';

const PAYMENT_MONTH_SELECT = Object.fromEntries(
  PAYMENT_MONTH_FIELD_KEYS.map((key) => [key, true])
) as Record<(typeof PAYMENT_MONTH_FIELD_KEYS)[number], true>;

type DriftEntry = {
  externalId: string;
  apartmentCode: string;
  year: number;
  openingBalance: DecimalLike;
};

type PreviousPayment = {
  apartmentId: string;
  year: number;
  openingBalance: DecimalLike;
} & Record<(typeof PAYMENT_MONTH_FIELD_KEYS)[number], DecimalLike>;

type DriftTransactionClient = Pick<TransactionClient, 'payment' | 'charge'>;

/**
 * Warns when the opening balance of a year differs from the closing balance
 * derived from charge records for the previous year, which must be complete.
 */
export async function validateBalanceDrift(
  tx: DriftTransactionClient,
  apartmentMap: Map<string, string>,
  entries: DriftEntry[],
  warnings: ImportWarning[]
): Promise<void> {
  const targets = entries.flatMap((entry) => {
    const apartmentId = apartmentMap.get(
      `${entry.externalId}#${entry.apartmentCode}`
    );
    return apartmentId ? [{ entry, apartmentId }] : [];
  });
  if (targets.length === 0) return;

  const previousPayments: PreviousPayment[] = await tx.payment.findMany({
    where: {
      OR: targets.map(({ entry, apartmentId }) => ({
        apartmentId,
        year: entry.year - 1,
        dateTo: { gte: fullYearEndThreshold(entry.year - 1) },
      })),
    },
    select: {
      apartmentId: true,
      year: true,
      openingBalance: true,
      ...PAYMENT_MONTH_SELECT,
    },
  });
  if (previousPayments.length === 0) return;

  const years = previousPayments.map(({ year }) => year);
  const chargeSums = await findMonthlyChargeSums(
    previousPayments.map(({ apartmentId }) => apartmentId),
    {
      fromPeriod: yearStartPeriod(Math.min(...years)),
      toPeriod: yearEndPeriod(Math.max(...years)),
    },
    tx
  );

  for (const { entry, apartmentId } of targets) {
    const previous = previousPayments.find(
      (payment) =>
        payment.apartmentId === apartmentId && payment.year === entry.year - 1
    );
    if (!previous) continue;

    const { calculatedClosingBalance: closingBalance } = applyDerivedFigures(
      previous,
      chargeSums.get(apartmentId),
      yearEndPeriod(previous.year)
    );
    const difference = toDecimal(entry.openingBalance).minus(closingBalance);

    if (difference.abs().greaterThan(WPLATY_BALANCE_TOLERANCE)) {
      warnings.push({
        apartmentExternalId: entry.apartmentCode,
        difference: difference.abs().toFixed(4),
        message:
          `Lokal ${entry.apartmentCode} (właściciel ${entry.externalId}), rok ${entry.year}: ` +
          `saldo otwarcia ${toDecimal(entry.openingBalance).toFixed(2)} ≠ ` +
          `saldo zamknięcia roku ${previous.year} wyliczone z naliczeń ${closingBalance.toFixed(2)}`,
      });
    }
  }
}
