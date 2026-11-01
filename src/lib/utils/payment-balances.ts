import type { ChargeSumsByPeriod } from '@/lib/queries/payments/find-monthly-charge-sums';
import { type Decimal, type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import {
  CALCULATED_CHARGE_FIELD_KEYS,
  LEGACY_PAYMENT_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';
import { monthIndexToPeriod } from '@/lib/utils/period';
import { sumDecimals } from '@/lib/utils/sum';

type LegacyPaymentKey = (typeof LEGACY_PAYMENT_FIELD_KEYS)[number];
type ChargeMonthKey = (typeof CALCULATED_CHARGE_FIELD_KEYS)[number];

export type PaymentFiguresSource = Record<
  (typeof PAYMENT_MONTH_FIELD_KEYS)[number] | 'openingBalance',
  DecimalLike
> & { year: number };

export type PaymentFigures = {
  monthlyCharges: Decimal[];
  monthlyBalances: Decimal[];
  closingBalance: Decimal;
};

export type DerivedPayment<T> = Omit<T, LegacyPaymentKey> &
  Record<ChargeMonthKey | 'calculatedClosingBalance', Decimal>;

/**
 * Monthly charges come from charge records (zero after `maxPeriod`); the
 * running and closing balance start from the imported opening balance.
 */
export function computePaymentFigures(
  payment: PaymentFiguresSource,
  chargeSums: ChargeSumsByPeriod | undefined,
  maxPeriod: string
): PaymentFigures {
  const monthlyCharges = PAYMENT_MONTH_FIELD_KEYS.map((_, monthIndex) => {
    const period = monthIndexToPeriod(payment.year, monthIndex);
    return period > maxPeriod
      ? toDecimal(0)
      : (chargeSums?.get(period) ?? toDecimal(0));
  });

  let balance = toDecimal(payment.openingBalance);
  const monthlyBalances = PAYMENT_MONTH_FIELD_KEYS.map((key, monthIndex) => {
    balance = balance
      .plus(toDecimal(payment[key]))
      .minus(monthlyCharges[monthIndex]);
    return balance;
  });

  return {
    monthlyCharges,
    monthlyBalances,
    closingBalance: toDecimal(payment.openingBalance)
      .plus(sumDecimals(PAYMENT_MONTH_FIELD_KEYS.map((key) => payment[key])))
      .minus(sumDecimals(monthlyCharges)),
  };
}

/**
 * Replaces the incorrect values imported from wplaty.txt (the `legacy*`
 * fields) with figures derived from charge records. Opening balances and
 * payments are kept as imported.
 */
export function applyDerivedFigures<T extends PaymentFiguresSource>(
  payment: T,
  chargeSums: ChargeSumsByPeriod | undefined,
  maxPeriod: string
): DerivedPayment<T> {
  const { monthlyCharges, closingBalance } = computePaymentFigures(
    payment,
    chargeSums,
    maxPeriod
  );
  const derived: Record<string, unknown> = { ...payment };

  for (const key of LEGACY_PAYMENT_FIELD_KEYS) {
    delete derived[key];
  }
  CALCULATED_CHARGE_FIELD_KEYS.forEach((key, monthIndex) => {
    derived[key] = monthlyCharges[monthIndex];
  });
  derived.calculatedClosingBalance = closingBalance;

  return derived as DerivedPayment<T>;
}
