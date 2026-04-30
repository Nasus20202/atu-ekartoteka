import { type DecimalLike, toDecimal } from '@/lib/money/decimal';
import type { ChargeDisplay } from '@/lib/types';

type ChargeAmountFieldKey = 'quantity' | 'unitPrice' | 'totalAmount';
type ChargeDateFieldKey = 'dateFrom' | 'dateTo';
type ChargeBaseFields = Omit<
  ChargeDisplay,
  ChargeAmountFieldKey | ChargeDateFieldKey
>;

export type ChargeLike = ChargeBaseFields &
  Record<ChargeAmountFieldKey, DecimalLike> &
  Record<ChargeDateFieldKey, Date | string>;

export type SerializableCharge = ChargeBaseFields &
  Record<ChargeAmountFieldKey, string>;

export type SerializableChargeDisplay = SerializableCharge &
  Record<ChargeDateFieldKey, string>;

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeCharge(charge: ChargeLike): SerializableChargeDisplay {
  return {
    ...charge,
    quantity: toDecimal(charge.quantity).toString(),
    unitPrice: toDecimal(charge.unitPrice).toString(),
    totalAmount: toDecimal(charge.totalAmount).toString(),
    dateFrom: toIsoString(charge.dateFrom),
    dateTo: toIsoString(charge.dateTo),
  };
}

export function toSerializableCharge(
  charge: SerializableChargeDisplay
): SerializableCharge {
  return {
    id: charge.id,
    description: charge.description,
    quantity: charge.quantity,
    unit: charge.unit,
    unitPrice: charge.unitPrice,
    totalAmount: charge.totalAmount,
  };
}
