import { prisma } from '@/lib/database/prisma';
import { validateBalanceDrift } from '@/lib/import/balance-drift-validation';
import { validateCrossYearBalances } from '@/lib/import/cross-year-validation';
import type { BatchImportResult, HOAImportResult } from '@/lib/import/types';
import { createEmptyStats } from '@/lib/import/utils';
import { runValidators } from '@/lib/import/validate-hoa-files';
import type { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import type { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import {
  LEGACY_CHARGE_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

type ApartmentKeys = { externalOwnerId: string; externalApartmentId: string };

const APARTMENT_KEYS_SELECT = {
  select: { externalOwnerId: true, externalApartmentId: true },
} as const;

function apartmentKey({
  externalOwnerId,
  externalApartmentId,
}: ApartmentKeys): string {
  return `${externalOwnerId}#${externalApartmentId}`;
}

async function loadChargeEntries(hoaId: string): Promise<NalCzynszEntry[]> {
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

async function loadPaymentEntries(hoaId: string): Promise<PaymentEntry[]> {
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

async function validateHoa(hoa: {
  id: string;
  externalId: string;
}): Promise<HOAImportResult> {
  const result: HOAImportResult = {
    hoaId: hoa.externalId,
    apartments: createEmptyStats(),
    errors: [],
    warnings: [],
  };
  const [chargeEntries, paymentEntries, apartments] = await Promise.all([
    loadChargeEntries(hoa.id),
    loadPaymentEntries(hoa.id),
    prisma.apartment.findMany({
      where: { homeownersAssociationId: hoa.id },
      select: { id: true, externalOwnerId: true, externalApartmentId: true },
    }),
  ]);
  const apartmentMap = new Map(
    apartments.map((apartment) => [apartmentKey(apartment), apartment.id])
  );

  runValidators(chargeEntries, paymentEntries, result);
  await validateCrossYearBalances(
    prisma,
    apartmentMap,
    paymentEntries,
    result.warnings
  );
  await validateBalanceDrift(
    prisma,
    apartmentMap,
    paymentEntries,
    result.warnings
  );

  return result;
}

/** Runs the import checks against stored data without modifying anything. */
export async function validateDatabase(): Promise<BatchImportResult> {
  const hoas = await prisma.homeownersAssociation.findMany({
    select: { id: true, externalId: true },
    orderBy: { externalId: 'asc' },
  });

  const results: HOAImportResult[] = [];
  for (const hoa of hoas) {
    results.push(await validateHoa(hoa));
  }

  return {
    success: results.every(({ errors }) => errors.length === 0),
    results,
    errors: [],
  };
}
