import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

const MIN_PAYMENT_YEAR = 1900;
const MAX_PAYMENT_YEAR = 2100;
const POSITIVE_BALANCE_CLASS = 'text-green-600';
const NEGATIVE_BALANCE_CLASS = 'text-red-600';

type PaymentAmounts = Record<
  | (typeof PAYMENT_MONTH_FIELD_KEYS)[number]
  | (typeof CHARGE_MONTH_FIELD_KEYS)[number]
  | 'openingBalance'
  | 'closingBalance',
  DecimalLike
>;

export function parsePaymentYear(year: string): number | null {
  const yearNumber = parseInt(year, 10);
  if (
    isNaN(yearNumber) ||
    yearNumber < MIN_PAYMENT_YEAR ||
    yearNumber > MAX_PAYMENT_YEAR
  ) {
    return null;
  }
  return yearNumber;
}

export function getPaymentSummary(payment: PaymentAmounts) {
  return {
    totalPayments: sumDecimals(
      PAYMENT_MONTH_FIELD_KEYS.map((key) => payment[key])
    ),
    totalCharges: sumDecimals(
      CHARGE_MONTH_FIELD_KEYS.map((key) => payment[key])
    ),
    openingBalance: toDecimal(payment.openingBalance),
    closingBalance: toDecimal(payment.closingBalance),
  };
}

export function getOpeningBalanceClass(balance: DecimalLike): string {
  const value = toDecimal(balance);
  if (value.isNegative()) return NEGATIVE_BALANCE_CLASS;
  return value.greaterThan(0) ? POSITIVE_BALANCE_CLASS : '';
}

export function getClosingBalanceClass(balance: DecimalLike): string {
  return toDecimal(balance).greaterThanOrEqualTo(0)
    ? POSITIVE_BALANCE_CLASS
    : NEGATIVE_BALANCE_CLASS;
}
