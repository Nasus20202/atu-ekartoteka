import { type DecimalLike, toDecimal } from '@/lib/money/decimal';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/payments/empty-months';
import type { Payment } from '@/lib/types';

export const PAYMENT_AMOUNT_FIELD_KEYS = [
  'openingBalance',
  'closingBalance',
  'openingDebt',
  'openingSurplus',
  ...PAYMENT_MONTH_FIELD_KEYS,
  ...CHARGE_MONTH_FIELD_KEYS,
] as const;

type PaymentAmountFieldKey = (typeof PAYMENT_AMOUNT_FIELD_KEYS)[number];
type PaymentDateFieldKey = 'dateFrom' | 'dateTo' | 'createdAt' | 'updatedAt';
type PaymentBaseFields = Omit<
  Payment,
  PaymentAmountFieldKey | PaymentDateFieldKey
>;

export type PaymentLike = PaymentBaseFields &
  Record<PaymentAmountFieldKey, DecimalLike> &
  Record<PaymentDateFieldKey, Date | string>;

export type SerializablePayment = PaymentBaseFields &
  Record<PaymentAmountFieldKey, string> &
  Record<PaymentDateFieldKey, string>;

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializePayment(payment: PaymentLike): SerializablePayment {
  const serializable = {
    ...payment,
    dateFrom: toIsoString(payment.dateFrom),
    dateTo: toIsoString(payment.dateTo),
    createdAt: toIsoString(payment.createdAt),
    updatedAt: toIsoString(payment.updatedAt),
  } as SerializablePayment;

  for (const key of PAYMENT_AMOUNT_FIELD_KEYS) {
    serializable[key] = toDecimal(payment[key]).toString();
  }

  return serializable;
}
