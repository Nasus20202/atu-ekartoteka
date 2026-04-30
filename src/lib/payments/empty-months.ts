import { type Decimal, toDecimal } from '@/lib/money/decimal';
import type { Payment } from '@/lib/types';

export type NonEmptyMonth = {
  monthIndex: number;
  charges: Decimal;
  payments: Decimal;
};

const PAYMENT_MONTH_KEYS = [
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

const CHARGE_MONTH_KEYS = [
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

export function getNonEmptyMonths(payment: Payment): NonEmptyMonth[] {
  return PAYMENT_MONTH_KEYS.flatMap((paymentKey, monthIndex) => {
    const payments = toDecimal(payment[paymentKey]);
    const charges = toDecimal(payment[CHARGE_MONTH_KEYS[monthIndex]]);

    if (payments.isZero() && charges.isZero()) {
      return [];
    }

    return [{ monthIndex, charges, payments }];
  });
}

export const PAYMENT_MONTH_FIELD_KEYS = PAYMENT_MONTH_KEYS;
export const CHARGE_MONTH_FIELD_KEYS = CHARGE_MONTH_KEYS;
