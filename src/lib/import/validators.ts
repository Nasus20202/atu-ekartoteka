import {
  CROSS_CHARGES_TOLERANCE,
  MONTHLY_CHARGES_IGNORED_NOTE,
  NAL_AMOUNT_TOLERANCE,
  SETTLEMENT_DESCRIPTION_PREFIX,
  WPLATY_BALANCE_TOLERANCE,
} from '@/lib/import/constants';
import type { ImportErrorItem, ImportWarning } from '@/lib/import/types';
import { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import { toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

export function validateNalCzynsz(entries: NalCzynszEntry[]): ImportWarning[] {
  const warnings: ImportWarning[] = [];

  for (const entry of entries) {
    const quantity = toDecimal(entry.quantity);
    const unitPrice = toDecimal(entry.unitPrice);
    const totalAmount = toDecimal(entry.totalAmount);
    const expected = quantity.mul(unitPrice);
    const delta = totalAmount.sub(expected).abs();
    if (delta.greaterThan(NAL_AMOUNT_TOLERANCE)) {
      warnings.push({
        kind: 'line-total',
        apartmentExternalId: entry.apartmentExternalId,
        period: entry.period,
        lineNo: entry.lineNo,
        difference: delta.toFixed(4),
        message:
          `Naliczenie ${entry.id} (lokal ${entry.apartmentExternalId}, linia ${entry.lineNo}): ` +
          `suma ${totalAmount.toFixed(4)} ≠ ${quantity.toFixed(4)} × ${unitPrice.toFixed(4)} = ${expected.toFixed(4)} (różnica ${delta.toFixed(4)})`,
      });
    }
  }

  return warnings;
}

function checkPaymentIdentity(entry: PaymentEntry) {
  const openingBalance = toDecimal(entry.openingBalance);
  const closingBalance = toDecimal(entry.closingBalance);
  const totalPayments = sumDecimals(entry.monthlyPayments);
  const totalCharges = sumDecimals(entry.monthlyCharges);
  const computed = openingBalance.plus(totalPayments).minus(totalCharges);
  const delta = closingBalance.sub(computed).abs();

  return {
    openingBalance,
    closingBalance,
    totalPayments,
    totalCharges,
    computed,
    delta,
    mismatch: delta.greaterThan(WPLATY_BALANCE_TOLERANCE),
  };
}

export function validateWplaty(entries: PaymentEntry[]): ImportErrorItem[] {
  const errors: ImportErrorItem[] = [];

  for (const entry of entries) {
    const check = checkPaymentIdentity(entry);
    if (check.mismatch) {
      errors.push({
        kind: 'balance-mismatch',
        message:
          `Wpłata ${entry.externalId} (lokal ${entry.apartmentCode}, rok ${entry.year}): ` +
          `saldo zamknięcia ${check.closingBalance.toFixed(4)} ≠ ` +
          `${check.openingBalance.toFixed(4)} + ${check.totalPayments.toFixed(2)} - ${check.totalCharges.toFixed(2)} = ${check.computed.toFixed(2)} ` +
          `(różnica ${check.delta.toFixed(4)})`,
      });
    }
  }

  return errors;
}

/** Year of each payment entry that fails the balance identity, in entry order. */
export function paymentErrorYears(entries: PaymentEntry[]): number[] {
  return entries
    .filter((entry) => checkPaymentIdentity(entry).mismatch)
    .map(({ year }) => year);
}

// Same owner#apartment identity as the importers, plus the YYYYMM period
function makeCrossFileKey(
  ownerId: string,
  apartmentId: string,
  period: string
): string {
  return `${ownerId}#${apartmentId}|${period}`;
}

type Money = ReturnType<typeof toDecimal>;

function addTo(map: Map<string, Money>, key: string, amount: Money): void {
  map.set(key, (map.get(key) ?? toDecimal(0)).plus(amount));
}

function isSettlementLine(entry: NalCzynszEntry): boolean {
  return entry.description
    .trim()
    .toLowerCase()
    .startsWith(SETTLEMENT_DESCRIPTION_PREFIX);
}

// One warning per owner, apartment and year listing every differing month
export function validateChargesCrossFile(
  nalEntries: NalCzynszEntry[],
  paymentEntries: PaymentEntry[]
): ImportWarning[] {
  const warnings: ImportWarning[] = [];

  const nalSums = new Map<string, Money>();
  const settlementSums = new Map<string, Money>();
  for (const entry of nalEntries) {
    const key = makeCrossFileKey(
      entry.id,
      entry.apartmentExternalId,
      entry.period
    );
    addTo(nalSums, key, toDecimal(entry.totalAmount));
    if (isSettlementLine(entry)) {
      addTo(settlementSums, key, toDecimal(entry.totalAmount));
    }
  }

  for (const payment of paymentEntries) {
    const months: string[] = [];
    let totalDifference = toDecimal(0);

    for (let i = 0; i < payment.monthlyCharges.length; i++) {
      const monthlyCharge = toDecimal(payment.monthlyCharges[i]);
      const period = `${payment.year}${String(i + 1).padStart(2, '0')}`;
      const key = makeCrossFileKey(
        payment.externalId,
        payment.apartmentCode,
        period
      );
      const nalSum = nalSums.get(key) ?? toDecimal(0);

      // Skip months where both sides are zero
      if (monthlyCharge.isZero() && nalSum.isZero()) continue;

      const delta = monthlyCharge.sub(nalSum).abs();
      if (!delta.greaterThan(CROSS_CHARGES_TOLERANCE)) continue;

      const settlement = settlementSums.get(key) ?? toDecimal(0);
      const unexplained = nalSum.minus(settlement).minus(monthlyCharge);
      const equalsSettlement =
        !settlement.isZero() &&
        unexplained.abs().lessThanOrEqualTo(CROSS_CHARGES_TOLERANCE);
      const difference = nalSum.minus(monthlyCharge);
      months.push(
        `${period}: suma naliczeń ${nalSum.toFixed(2)} ≠ naliczenia z wpłat ${monthlyCharge.toFixed(2)}` +
          (equalsSettlement
            ? ` (różnica ${difference.toFixed(2)} równa wyrównaniom)`
            : ` (niewyjaśniona różnica ${unexplained.toFixed(2)})`)
      );
      totalDifference = totalDifference.plus(delta);
    }

    if (months.length > 0) {
      warnings.push({
        kind: 'charges-mismatch',
        apartmentExternalId: payment.apartmentCode,
        year: payment.year,
        difference: totalDifference.toFixed(4),
        message:
          `Lokal ${payment.apartmentCode} (właściciel ${payment.externalId}), rok ${payment.year}: ` +
          `${months.length} mies. z różnicą — ${months.join('; ')}. ` +
          MONTHLY_CHARGES_IGNORED_NOTE,
      });
    }
  }

  return warnings;
}
