import {
  NAL_AMOUNT_TOLERANCE,
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
        year: entry.year,
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
