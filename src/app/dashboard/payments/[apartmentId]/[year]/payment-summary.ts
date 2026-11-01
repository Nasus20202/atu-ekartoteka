import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import {
  CALCULATED_CHARGE_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

const MIN_PAYMENT_YEAR = 1900;
const MAX_PAYMENT_YEAR = 2100;

type PaymentAmounts = Record<
  | (typeof PAYMENT_MONTH_FIELD_KEYS)[number]
  | (typeof CALCULATED_CHARGE_FIELD_KEYS)[number]
  | 'openingBalance'
  | 'calculatedClosingBalance',
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
      CALCULATED_CHARGE_FIELD_KEYS.map((key) => payment[key])
    ),
    openingBalance: toDecimal(payment.openingBalance),
    closingBalance: toDecimal(payment.calculatedClosingBalance),
  };
}
