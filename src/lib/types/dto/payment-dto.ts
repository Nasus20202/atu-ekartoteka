import type { Payment } from '@/lib/types';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';

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

export type PaymentDtoSource = PaymentBaseFields &
  Record<PaymentAmountFieldKey, DecimalLike> &
  Record<PaymentDateFieldKey, Date | string>;

export type PaymentPdfDto = PaymentBaseFields &
  Record<PaymentAmountFieldKey, string> &
  Record<PaymentDateFieldKey, string>;

export type PaymentListItemDto = PaymentPdfDto;

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toPaymentPdfDto(payment: PaymentDtoSource): PaymentPdfDto {
  const dto = {
    ...payment,
    dateFrom: toIsoString(payment.dateFrom),
    dateTo: toIsoString(payment.dateTo),
    createdAt: toIsoString(payment.createdAt),
    updatedAt: toIsoString(payment.updatedAt),
  } as PaymentPdfDto;

  for (const key of PAYMENT_AMOUNT_FIELD_KEYS) {
    dto[key] = toDecimal(payment[key]).toString();
  }

  return dto;
}

export const toPaymentListItemDto = toPaymentPdfDto;
