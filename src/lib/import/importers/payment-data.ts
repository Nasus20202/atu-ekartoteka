import { Prisma } from '@/generated/prisma/client';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import { decimalEqualsStored } from '@/lib/utils/decimal';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';

export type PaymentKey = {
  apartmentId: string;
  year: number;
};

type PaymentMonthField = (typeof PAYMENT_MONTH_FIELD_KEYS)[number];
type ChargeMonthField = (typeof CHARGE_MONTH_FIELD_KEYS)[number];

export type ExistingPayment = PaymentKey & {
  id: string;
  dateFrom: Date;
  dateTo: Date;
  openingDebt: Prisma.Decimal;
  openingSurplus: Prisma.Decimal;
  openingBalance: Prisma.Decimal;
  closingBalance: Prisma.Decimal;
} & Record<PaymentMonthField | ChargeMonthField, Prisma.Decimal>;

type PaymentData = {
  apartmentId?: string;
  year: number;
  dateFrom: Date;
  dateTo: Date;
  openingDebt: PaymentEntry['openingDebt'];
  openingSurplus: PaymentEntry['openingSurplus'];
  openingBalance: PaymentEntry['openingBalance'];
  closingBalance: PaymentEntry['closingBalance'];
} & Record<PaymentMonthField, PaymentEntry['monthlyPayments'][number]> &
  Record<ChargeMonthField, PaymentEntry['monthlyCharges'][number]>;

export function makePaymentKey(p: PaymentKey): string {
  return `${p.apartmentId}|${p.year}`;
}

export function buildPaymentData(
  entry: PaymentEntry,
  apartmentId?: string
): PaymentData {
  const monthData = Object.fromEntries([
    ...PAYMENT_MONTH_FIELD_KEYS.map((field, index) => [
      field,
      entry.monthlyPayments[index],
    ]),
    ...CHARGE_MONTH_FIELD_KEYS.map((field, index) => [
      field,
      entry.monthlyCharges[index],
    ]),
  ]) as Record<PaymentMonthField, PaymentEntry['monthlyPayments'][number]> &
    Record<ChargeMonthField, PaymentEntry['monthlyCharges'][number]>;

  return {
    ...(apartmentId ? { apartmentId } : {}),
    year: entry.year,
    dateFrom: entry.dateFrom,
    dateTo: entry.dateTo,
    openingDebt: entry.openingDebt,
    openingSurplus: entry.openingSurplus,
    openingBalance: entry.openingBalance,
    closingBalance: entry.closingBalance,
    ...monthData,
  };
}

export function hasPaymentChanged(
  existing: ExistingPayment,
  entry: PaymentEntry
): boolean {
  const paymentData = buildPaymentData(entry);

  return (
    existing.dateFrom.getTime() !== entry.dateFrom.getTime() ||
    existing.dateTo.getTime() !== entry.dateTo.getTime() ||
    !decimalEqualsStored(existing.openingDebt, entry.openingDebt) ||
    !decimalEqualsStored(existing.openingSurplus, entry.openingSurplus) ||
    !decimalEqualsStored(existing.openingBalance, entry.openingBalance) ||
    !decimalEqualsStored(existing.closingBalance, entry.closingBalance) ||
    PAYMENT_MONTH_FIELD_KEYS.some(
      (field) => !decimalEqualsStored(existing[field], paymentData[field])
    ) ||
    CHARGE_MONTH_FIELD_KEYS.some(
      (field) => !decimalEqualsStored(existing[field], paymentData[field])
    )
  );
}
