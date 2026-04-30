import type { ChargeDisplay } from '@/lib/types';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';

type ChargeAmountFieldKey = 'quantity' | 'unitPrice' | 'totalAmount';
type ChargeDateFieldKey = 'dateFrom' | 'dateTo';
type ChargeBaseFields = Omit<
  ChargeDisplay,
  ChargeAmountFieldKey | ChargeDateFieldKey
>;

export type ChargeDtoSource = ChargeBaseFields &
  Record<ChargeAmountFieldKey, DecimalLike> &
  Record<ChargeDateFieldKey, Date | string>;

export type ChargePdfItemDto = ChargeBaseFields &
  Record<ChargeAmountFieldKey, string>;

export type ChargeDisplayDto = ChargePdfItemDto &
  Record<ChargeDateFieldKey, string>;

export type ChargePeriodItemDto = ChargePdfItemDto & {
  period: string;
};

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toChargeDisplayDto(charge: ChargeDtoSource): ChargeDisplayDto {
  return {
    ...charge,
    quantity: toDecimal(charge.quantity).toString(),
    unitPrice: toDecimal(charge.unitPrice).toString(),
    totalAmount: toDecimal(charge.totalAmount).toString(),
    dateFrom: toIsoString(charge.dateFrom),
    dateTo: toIsoString(charge.dateTo),
  };
}

export function toChargePdfItemDto(charge: ChargeDisplayDto): ChargePdfItemDto {
  return {
    id: charge.id,
    description: charge.description,
    quantity: charge.quantity,
    unit: charge.unit,
    unitPrice: charge.unitPrice,
    totalAmount: charge.totalAmount,
  };
}

export function toChargePeriodItemDto(
  charge: ChargeDtoSource & { period: string }
): ChargePeriodItemDto {
  return {
    id: charge.id,
    description: charge.description,
    quantity: toDecimal(charge.quantity).toString(),
    unit: charge.unit,
    unitPrice: toDecimal(charge.unitPrice).toString(),
    totalAmount: toDecimal(charge.totalAmount).toString(),
    period: charge.period,
  };
}
