import { type Decimal, type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { monthIndexToPeriod } from '@/lib/utils/period';
import { sumDecimals } from '@/lib/utils/sum';

export type NonEmptyMonth = {
  monthIndex: number;
  charges: Decimal;
  payments: Decimal;
};

export type PaymentMonthFieldsLike = Record<
  | (typeof PAYMENT_MONTH_FIELD_KEYS)[number]
  | (typeof CALCULATED_CHARGE_FIELD_KEYS)[number],
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

export const CALCULATED_CHARGE_FIELD_KEYS = [
  'calculatedJanuaryCharges',
  'calculatedFebruaryCharges',
  'calculatedMarchCharges',
  'calculatedAprilCharges',
  'calculatedMayCharges',
  'calculatedJuneCharges',
  'calculatedJulyCharges',
  'calculatedAugustCharges',
  'calculatedSeptemberCharges',
  'calculatedOctoberCharges',
  'calculatedNovemberCharges',
  'calculatedDecemberCharges',
] as const;

// Stored as imported from wplaty.txt; the exporter omits settlement lines, so
// these are only for import code (see the `legacy` ESLint restriction).
export const LEGACY_CHARGE_FIELD_KEYS = [
  'legacyJanuaryCharges',
  'legacyFebruaryCharges',
  'legacyMarchCharges',
  'legacyAprilCharges',
  'legacyMayCharges',
  'legacyJuneCharges',
  'legacyJulyCharges',
  'legacyAugustCharges',
  'legacySeptemberCharges',
  'legacyOctoberCharges',
  'legacyNovemberCharges',
  'legacyDecemberCharges',
] as const;

export const LEGACY_PAYMENT_FIELD_KEYS = [
  ...LEGACY_CHARGE_FIELD_KEYS,
  'legacyClosingBalance',
] as const;

export function getNonEmptyMonths<T extends PaymentMonthFieldsLike>(
  payment: T,
  maxPeriod?: string | null
): NonEmptyMonth[] {
  return PAYMENT_MONTH_FIELD_KEYS.flatMap((paymentKey, monthIndex) => {
    const payments = toDecimal(payment[paymentKey]);
    const charges = toDecimal(
      payment[CALCULATED_CHARGE_FIELD_KEYS[monthIndex]]
    );

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
    CALCULATED_CHARGE_FIELD_KEYS.map((key) => payment[key])
  );

  return {
    yearPayments,
    yearCharges,
    totalPayments: yearPayments.plus(toDecimal(payment.openingSurplus)),
    totalCharges: yearCharges.plus(toDecimal(payment.openingDebt)),
  };
}
