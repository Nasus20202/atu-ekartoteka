import { prisma } from '@/lib/database/prisma';
import type { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import type { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import {
  LEGACY_CHARGE_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

const APARTMENT_KEYS_SELECT = {
  select: { externalOwnerId: true, externalApartmentId: true },
} as const;

export async function loadChargeEntries(
  hoaId: string
): Promise<NalCzynszEntry[]> {
  const charges = await prisma.charge.findMany({
    where: { apartment: { homeownersAssociationId: hoaId } },
    include: { apartment: APARTMENT_KEYS_SELECT },
  });

  return charges.map((charge) => ({
    id: charge.apartment.externalOwnerId,
    apartmentExternalId: charge.apartment.externalApartmentId,
    dateFrom: charge.dateFrom,
    dateTo: charge.dateTo,
    period: charge.period,
    lineNo: charge.externalLineNo,
    description: charge.description,
    quantity: charge.quantity,
    unit: charge.unit,
    unitPrice: charge.unitPrice,
    totalAmount: charge.totalAmount,
  }));
}

export async function loadPaymentEntries(
  hoaId: string
): Promise<PaymentEntry[]> {
  const payments = await prisma.payment.findMany({
    where: { apartment: { homeownersAssociationId: hoaId } },
    include: { apartment: APARTMENT_KEYS_SELECT },
    orderBy: [{ apartmentId: 'asc' }, { year: 'asc' }],
  });

  return payments.map((payment) => {
    const monthlyCharges = LEGACY_CHARGE_FIELD_KEYS.map((key) => payment[key]);

    return {
      externalId: payment.apartment.externalOwnerId,
      apartmentCode: payment.apartment.externalApartmentId,
      year: payment.year,
      dateFrom: payment.dateFrom,
      dateTo: payment.dateTo,
      openingDebt: payment.openingDebt,
      openingSurplus: payment.openingSurplus,
      openingBalance: payment.openingBalance,
      totalCharges: sumDecimals(monthlyCharges),
      monthlyCharges,
      monthlyPayments: PAYMENT_MONTH_FIELD_KEYS.map((key) => payment[key]),
      closingBalance: payment.legacyClosingBalance,
    };
  });
}
