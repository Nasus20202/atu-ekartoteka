import {
  CROSS_CHARGES_TOLERANCE,
  NAL_AMOUNT_TOLERANCE,
  WPLATY_BALANCE_TOLERANCE,
} from '@/lib/import/constants';
import type { ImportWarning } from '@/lib/import/types';
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

export function validateWplaty(entries: PaymentEntry[]): string[] {
  const errors: string[] = [];

  for (const entry of entries) {
    const openingBalance = toDecimal(entry.openingBalance);
    const closingBalance = toDecimal(entry.closingBalance);
    const totalPayments = sumDecimals(entry.monthlyPayments);
    const totalCharges = sumDecimals(entry.monthlyCharges);
    const computed = openingBalance.plus(totalPayments).minus(totalCharges);
    const delta = closingBalance.sub(computed).abs();
    if (delta.greaterThan(WPLATY_BALANCE_TOLERANCE)) {
      errors.push(
        `Wpłata ${entry.externalId} (lokal ${entry.apartmentCode}, rok ${entry.year}): ` +
          `saldo zamknięcia ${closingBalance.toFixed(4)} ≠ ` +
          `${openingBalance.toFixed(4)} + ${totalPayments.toFixed(2)} - ${totalCharges.toFixed(2)} = ${computed.toFixed(2)} ` +
          `(różnica ${delta.toFixed(4)})`
      );
    }
  }

  return errors;
}

export function validateChargesCrossFile(
  nalEntries: NalCzynszEntry[],
  paymentEntries: PaymentEntry[]
): string[] {
  const errors: string[] = [];

  // Sum nal_czynsz totalAmount grouped by apartmentExternalId + period (YYYYMM)
  const nalSums = new Map<string, ReturnType<typeof toDecimal>>();
  for (const entry of nalEntries) {
    const key = `${entry.apartmentExternalId}|${entry.period}`;
    nalSums.set(
      key,
      (nalSums.get(key) ?? toDecimal(0)).plus(entry.totalAmount)
    );
  }

  for (const payment of paymentEntries) {
    for (let i = 0; i < payment.monthlyCharges.length; i++) {
      const monthlyCharge = toDecimal(payment.monthlyCharges[i]);
      const month = String(i + 1).padStart(2, '0');
      const period = `${payment.year}${month}`;
      const key = `${payment.apartmentCode}|${period}`;
      const nalSum = nalSums.get(key) ?? toDecimal(0);

      // Skip months where both sides are zero
      if (monthlyCharge.isZero() && nalSum.isZero()) continue;

      const delta = monthlyCharge.sub(nalSum).abs();

      if (delta.greaterThan(CROSS_CHARGES_TOLERANCE)) {
        errors.push(
          `Lokal ${payment.apartmentCode}, okres ${period}: ` +
            `suma naliczeń ${nalSum.toFixed(2)} ≠ naliczenia z wpłat ${monthlyCharge.toFixed(2)} ` +
            `(różnica ${delta.toFixed(4)})`
        );
      }
    }
  }

  return errors;
}
