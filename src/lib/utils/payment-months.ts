import { type Decimal, type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

export type NonEmptyMonth = {
  monthIndex: number;
  charges: Decimal;
  payments: Decimal;
};

export function dateToPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

export function isPeriodAfterDate(
  period: string,
  dateStr: string | null
): boolean {
  if (!dateStr) return false;
  const maxPeriod = dateToPeriod(new Date(dateStr));
  return period > maxPeriod;
}

export type PaymentMonthFieldsLike = Record<
  | (typeof PAYMENT_MONTH_FIELD_KEYS)[number]
  | (typeof CHARGE_MONTH_FIELD_KEYS)[number],
  DecimalLike
>;

export const PAYMENT_MONTH_FIELD_KEYS = [
  'januaryPayments',
  'februaryPayments',
  'marchPayments',
  'aprilPayments',
  'mayPayments',
  'junePayments',
  'julyPayments',
  'augustPayments',
  'septemberPayments',
  'octoberPayments',
  'novemberPayments',
  'decemberPayments',
] as const;

export const CHARGE_MONTH_FIELD_KEYS = [
  'januaryCharges',
  'februaryCharges',
  'marchCharges',
  'aprilCharges',
  'mayCharges',
  'juneCharges',
  'julyCharges',
  'augustCharges',
  'septemberCharges',
  'octoberCharges',
  'novemberCharges',
  'decemberCharges',
] as const;

function monthIndexToPeriod(year: number, monthIndex: number): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  return `${year}${month}`;
}

export function getNonEmptyMonths<T extends PaymentMonthFieldsLike>(
  payment: T,
  maxPeriod?: string | null
): NonEmptyMonth[] {
  return PAYMENT_MONTH_FIELD_KEYS.flatMap((paymentKey, monthIndex) => {
    const payments = toDecimal(payment[paymentKey]);
    const charges = toDecimal(payment[CHARGE_MONTH_FIELD_KEYS[monthIndex]]);

    if (payments.isZero() && charges.isZero()) {
      return [];
    }

    const year = 'year' in payment ? (payment as { year: number }).year : 0;
    const period = monthIndexToPeriod(year, monthIndex);

    if (maxPeriod && period > maxPeriod) {
      return [];
    }

    return [{ monthIndex, charges, payments }];
  });
}

export type PaymentTotals = {
  yearPayments: Decimal;
  yearCharges: Decimal;
  totalPayments: Decimal;
  totalCharges: Decimal;
};

export function getPaymentTotals(
  payment: PaymentMonthFieldsLike &
    Record<'openingSurplus' | 'openingDebt', DecimalLike>
): PaymentTotals {
  const yearPayments = sumDecimals(
    PAYMENT_MONTH_FIELD_KEYS.map((key) => payment[key])
  );
  const yearCharges = sumDecimals(
    CHARGE_MONTH_FIELD_KEYS.map((key) => payment[key])
  );

  return {
    yearPayments,
    yearCharges,
    totalPayments: yearPayments.plus(toDecimal(payment.openingSurplus)),
    totalCharges: yearCharges.plus(toDecimal(payment.openingDebt)),
  };
}
