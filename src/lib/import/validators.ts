import {
  CROSS_CHARGES_TOLERANCE,
  NAL_AMOUNT_TOLERANCE,
  WPLATY_BALANCE_TOLERANCE,
} from '@/lib/import/constants';
import { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';

export function validateNalCzynsz(entries: NalCzynszEntry[]): string[] {
  const errors: string[] = [];

  for (const entry of entries) {
    const expected = entry.quantity * entry.unitPrice;
    const delta = Math.abs(entry.totalAmount - expected);
    if (delta > NAL_AMOUNT_TOLERANCE) {
      errors.push(
        `Naliczenie ${entry.id} (lokal ${entry.apartmentExternalId}, linia ${entry.lineNo}): ` +
          `suma ${entry.totalAmount} ≠ ${entry.quantity} × ${entry.unitPrice} = ${expected.toFixed(4)} (różnica ${delta.toFixed(4)})`
      );
    }
  }

  return errors;
}

export function validateWplaty(entries: PaymentEntry[]): string[] {
  const errors: string[] = [];

  for (const entry of entries) {
    const totalPayments = entry.monthlyPayments.reduce((s, v) => s + v, 0);
    const totalCharges = entry.monthlyCharges.reduce((s, v) => s + v, 0);
    const computed = entry.openingBalance + totalPayments - totalCharges;
    const delta = Math.abs(entry.closingBalance - computed);
    if (delta > WPLATY_BALANCE_TOLERANCE) {
      errors.push(
        `Wpłata ${entry.externalId} (lokal ${entry.apartmentCode}, rok ${entry.year}): ` +
          `saldo zamknięcia ${entry.closingBalance} ≠ ` +
          `${entry.openingBalance} + ${totalPayments.toFixed(2)} - ${totalCharges.toFixed(2)} = ${computed.toFixed(2)} ` +
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
  const nalSums = new Map<string, number>();
  for (const entry of nalEntries) {
    const key = `${entry.apartmentExternalId}|${entry.period}`;
    nalSums.set(key, (nalSums.get(key) ?? 0) + entry.totalAmount);
  }

  for (const payment of paymentEntries) {
    for (let i = 0; i < payment.monthlyCharges.length; i++) {
      const monthlyCharge = payment.monthlyCharges[i];
      const month = String(i + 1).padStart(2, '0');
      const period = `${payment.year}${month}`;
      const key = `${payment.apartmentCode}|${period}`;
      const nalSum = nalSums.get(key) ?? 0;

      // Skip months where both sides are zero
      if (monthlyCharge === 0 && nalSum === 0) continue;

      const delta = Math.abs(monthlyCharge - nalSum);

      if (delta > CROSS_CHARGES_TOLERANCE) {
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
