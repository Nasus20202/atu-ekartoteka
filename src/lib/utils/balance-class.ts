import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';

const POSITIVE_BALANCE_CLASS = 'text-green-600';
const NEGATIVE_BALANCE_CLASS = 'text-red-600';

/** Red below zero, green above zero, no colour at zero. */
export function getSignedBalanceClass(balance: DecimalLike): string {
  const value = toDecimal(balance);
  if (value.isNegative()) return NEGATIVE_BALANCE_CLASS;
  return value.greaterThan(0) ? POSITIVE_BALANCE_CLASS : '';
}

/** Green when nothing is owed, red otherwise. */
export function getBalanceStatusClass(balance: DecimalLike): string {
  return toDecimal(balance).greaterThanOrEqualTo(0)
    ? POSITIVE_BALANCE_CLASS
    : NEGATIVE_BALANCE_CLASS;
}
