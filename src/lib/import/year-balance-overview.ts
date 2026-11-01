import { WPLATY_BALANCE_TOLERANCE } from '@/lib/import/constants';
import type { YearBalanceRow, YearRecord } from '@/lib/import/types';
import type { MonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';
import { type Decimal, toDecimal } from '@/lib/utils/decimal';
import {
  applyDerivedFigures,
  type PaymentFiguresSource,
} from '@/lib/utils/payment-balances';
import { yearEndPeriod } from '@/lib/utils/period';

export type BalancePaymentSource = PaymentFiguresSource & {
  apartmentId: string;
  apartmentLabel: string;
  ownerId: string;
};

export type YearBalanceSummary = Omit<YearBalanceRow, 'issueCount' | 'status'>;

type YearFigures = { opening: Decimal; closing: Decimal };
type ApartmentHistory = {
  label: string;
  ownerId: string;
  years: Map<number, YearFigures>;
};
type YearRecords = {
  records: YearRecord[];
  carryOver: Decimal;
  newOpening: Decimal;
};

function isOutsideTolerance(difference: Decimal): boolean {
  return difference.abs().greaterThan(WPLATY_BALANCE_TOLERANCE);
}

function buildHistories(
  payments: BalancePaymentSource[],
  chargeSums: MonthlyChargeSums
): Map<string, ApartmentHistory> {
  const histories = new Map<string, ApartmentHistory>();

  for (const payment of payments) {
    const { calculatedClosingBalance } = applyDerivedFigures(
      payment,
      chargeSums.get(payment.apartmentId),
      yearEndPeriod(payment.year)
    );
    const history = histories.get(payment.apartmentId) ?? {
      label: payment.apartmentLabel,
      ownerId: payment.ownerId,
      years: new Map<number, YearFigures>(),
    };
    history.years.set(payment.year, {
      opening: toDecimal(payment.openingBalance),
      closing: calculatedClosingBalance,
    });
    histories.set(payment.apartmentId, history);
  }

  return histories;
}

/**
 * One record per apartment record of the year. A record is compared only with
 * the same apartment record in the next stored year, so a new owner's record
 * does not affect the previous owner's record.
 */
function yearRecords(
  histories: Map<string, ApartmentHistory>,
  year: number,
  previousYear: number | undefined,
  nextYear: number | undefined
): YearRecords {
  const result: YearRecords = {
    records: [],
    carryOver: toDecimal(0),
    newOpening: toDecimal(0),
  };

  for (const history of histories.values()) {
    const figures = history.years.get(year);
    if (!figures) continue;

    const next =
      nextYear === undefined ? undefined : history.years.get(nextYear);
    const difference = next ? figures.closing.minus(next.opening) : null;
    const isNew =
      previousYear !== undefined && !history.years.has(previousYear);

    let status: YearRecord['status'] = 'last';
    if (nextYear !== undefined) {
      if (!next) status = 'ended';
      else if (difference && isOutsideTolerance(difference)) {
        status = 'mismatch';
      } else status = 'match';
    }

    result.records.push({
      apartmentLabel: history.label,
      ownerId: history.ownerId,
      opening: figures.opening.toFixed(2),
      closing: figures.closing.toFixed(2),
      nextOpening: next ? next.opening.toFixed(2) : null,
      difference: difference ? difference.toFixed(2) : null,
      status,
      isNew,
    });
    if (difference) result.carryOver = result.carryOver.plus(difference);
    if (isNew) result.newOpening = result.newOpening.plus(figures.opening);
  }

  return result;
}

/**
 * Sums one HOA's apartment records per year. The closing balance is derived
 * from charge records, the same way as the drift check. A year is marked when
 * the records present in it and in the next stored year do not carry over.
 */
export function buildYearBalanceRows(
  payments: BalancePaymentSource[],
  chargeSums: MonthlyChargeSums
): YearBalanceSummary[] {
  const histories = buildHistories(payments, chargeSums);
  const totals = new Map<number, YearFigures>();

  for (const { years } of histories.values()) {
    for (const [year, figures] of years) {
      const current = totals.get(year) ?? {
        opening: toDecimal(0),
        closing: toDecimal(0),
      };
      totals.set(year, {
        opening: current.opening.plus(figures.opening),
        closing: current.closing.plus(figures.closing),
      });
    }
  }

  const sorted = Array.from(totals.entries()).sort(([a], [b]) => a - b);

  return sorted.map(([year, { opening, closing }], index) => {
    const previousYear = sorted[index - 1]?.[0];
    const nextYear = sorted[index + 1]?.[0];
    const { records, carryOver, newOpening } = yearRecords(
      histories,
      year,
      previousYear,
      nextYear
    );

    return {
      year,
      openingBalance: opening.toFixed(2),
      calculatedClosing: closing.toFixed(2),
      closingMismatch: nextYear !== undefined && isOutsideTolerance(carryOver),
      records,
      newRecordsOpening: newOpening.toFixed(2),
    };
  });
}
