import { Prisma } from '@/generated/prisma/client';
import { IMPORT_CREATE_BATCH_SIZE } from '@/lib/import/constants';
import { EntityStats, TransactionClient } from '@/lib/import/types';
import { processInBatches } from '@/lib/import/utils';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import { toDecimal } from '@/lib/utils/decimal';

type PaymentKey = {
  apartmentId: string;
  year: number;
};

type ExistingPayment = PaymentKey & {
  id: string;
  dateFrom: Date;
  dateTo: Date;
  openingDebt: Prisma.Decimal;
  openingSurplus: Prisma.Decimal;
  openingBalance: Prisma.Decimal;
  closingBalance: Prisma.Decimal;
  januaryPayments: Prisma.Decimal;
  februaryPayments: Prisma.Decimal;
  marchPayments: Prisma.Decimal;
  aprilPayments: Prisma.Decimal;
  mayPayments: Prisma.Decimal;
  junePayments: Prisma.Decimal;
  julyPayments: Prisma.Decimal;
  augustPayments: Prisma.Decimal;
  septemberPayments: Prisma.Decimal;
  octoberPayments: Prisma.Decimal;
  novemberPayments: Prisma.Decimal;
  decemberPayments: Prisma.Decimal;
  januaryCharges: Prisma.Decimal;
  februaryCharges: Prisma.Decimal;
  marchCharges: Prisma.Decimal;
  aprilCharges: Prisma.Decimal;
  mayCharges: Prisma.Decimal;
  juneCharges: Prisma.Decimal;
  julyCharges: Prisma.Decimal;
  augustCharges: Prisma.Decimal;
  septemberCharges: Prisma.Decimal;
  octoberCharges: Prisma.Decimal;
  novemberCharges: Prisma.Decimal;
  decemberCharges: Prisma.Decimal;
};

const PAYMENT_MONTH_FIELDS = [
  'januaryPayments',
  'februaryPayments',
  'marchPayments',
  'aprilPayments',
  'mayPayments',
  'junePayments',
  'julyPayments',
  'augustPayments',
  'septemberPayments',
  'octoberPayments',
  'novemberPayments',
  'decemberPayments',
] as const;

const CHARGE_MONTH_FIELDS = [
  'januaryCharges',
  'februaryCharges',
  'marchCharges',
  'aprilCharges',
  'mayCharges',
  'juneCharges',
  'julyCharges',
  'augustCharges',
  'septemberCharges',
  'octoberCharges',
  'novemberCharges',
  'decemberCharges',
] as const;

type PaymentMonthField = (typeof PAYMENT_MONTH_FIELDS)[number];
type ChargeMonthField = (typeof CHARGE_MONTH_FIELDS)[number];

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

function makePaymentKey(p: PaymentKey): string {
  return `${p.apartmentId}|${p.year}`;
}

export function buildPaymentData(
  entry: PaymentEntry,
  apartmentId?: string
): PaymentData {
  const monthData = Object.fromEntries([
    ...PAYMENT_MONTH_FIELDS.map((field, index) => [
      field,
      entry.monthlyPayments[index],
    ]),
    ...CHARGE_MONTH_FIELDS.map((field, index) => [
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

function hasPaymentChanged(
  existing: ExistingPayment,
  entry: PaymentEntry
): boolean {
  const paymentData = buildPaymentData(entry);

  return (
    existing.dateFrom.getTime() !== entry.dateFrom.getTime() ||
    existing.dateTo.getTime() !== entry.dateTo.getTime() ||
    !toDecimal(existing.openingDebt).equals(toDecimal(entry.openingDebt)) ||
    !toDecimal(existing.openingSurplus).equals(
      toDecimal(entry.openingSurplus)
    ) ||
    !toDecimal(existing.openingBalance).equals(
      toDecimal(entry.openingBalance)
    ) ||
    !toDecimal(existing.closingBalance).equals(
      toDecimal(entry.closingBalance)
    ) ||
    PAYMENT_MONTH_FIELDS.some(
      (field) =>
        !toDecimal(existing[field]).equals(toDecimal(paymentData[field]))
    ) ||
    CHARGE_MONTH_FIELDS.some(
      (field) =>
        !toDecimal(existing[field]).equals(toDecimal(paymentData[field]))
    )
  );
}

export async function importPayments(
  tx: TransactionClient,
  apartmentMap: Map<string, string>,
  entries: PaymentEntry[],
  stats: EntityStats,
  errors: string[]
): Promise<void> {
  // Filter entries with valid apartment IDs (using combined key: externalOwnerId#externalApartmentId)
  const validEntries: Array<{ entry: PaymentEntry; apartmentId: string }> = [];
  const apartmentIds = new Set<string>();
  const years = new Set<number>();

  for (const entry of entries) {
    const apartmentId = apartmentMap.get(
      `${entry.externalId}#${entry.apartmentCode}`
    );
    if (!apartmentId) {
      continue;
    }

    validEntries.push({ entry, apartmentId });
    apartmentIds.add(apartmentId);
    years.add(entry.year);
  }

  stats.skipped = entries.length - validEntries.length;

  if (validEntries.length === 0) return;

  const existingPayments = await tx.payment.findMany({
    where: {
      apartmentId: { in: Array.from(apartmentIds) },
      year: { in: Array.from(years) },
    },
    select: {
      id: true,
      apartmentId: true,
      year: true,
      dateFrom: true,
      dateTo: true,
      openingDebt: true,
      openingSurplus: true,
      openingBalance: true,
      closingBalance: true,
      januaryPayments: true,
      februaryPayments: true,
      marchPayments: true,
      aprilPayments: true,
      mayPayments: true,
      junePayments: true,
      julyPayments: true,
      augustPayments: true,
      septemberPayments: true,
      octoberPayments: true,
      novemberPayments: true,
      decemberPayments: true,
      januaryCharges: true,
      februaryCharges: true,
      marchCharges: true,
      aprilCharges: true,
      mayCharges: true,
      juneCharges: true,
      julyCharges: true,
      augustCharges: true,
      septemberCharges: true,
      octoberCharges: true,
      novemberCharges: true,
      decemberCharges: true,
    },
  });

  const existingMap = new Map<string, ExistingPayment>(
    existingPayments.map((p: ExistingPayment) => [makePaymentKey(p), p])
  );

  const toCreate: Array<{ entry: PaymentEntry; apartmentId: string }> = [];
  const toUpdate: Array<{ id: string; entry: PaymentEntry }> = [];

  for (const { entry, apartmentId } of validEntries) {
    const key = makePaymentKey({
      apartmentId,
      year: entry.year,
    });
    const existing = existingMap.get(key);

    if (existing) {
      if (hasPaymentChanged(existing, entry)) {
        toUpdate.push({ id: existing.id, entry });
      }
      // If not changed, skip
    } else {
      toCreate.push({ entry, apartmentId });
    }
  }

  // Batch create new payments
  if (toCreate.length > 0) {
    try {
      await processInBatches(
        toCreate,
        IMPORT_CREATE_BATCH_SIZE,
        async (batch) => {
          await tx.payment.createMany({
            data: batch.map(({ entry, apartmentId }) =>
              buildPaymentData(entry, apartmentId)
            ),
            skipDuplicates: true,
          });
        }
      );
      stats.created = toCreate.length;
    } catch (error) {
      errors.push(
        `Błąd tworzenia płatności: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped += toCreate.length;
    }
  }

  // Update only changed payments
  for (const { id, entry } of toUpdate) {
    try {
      await tx.payment.update({
        where: { id },
        data: buildPaymentData(entry),
      });
      stats.updated++;
    } catch (error) {
      errors.push(
        `Błąd aktualizacji płatności ${entry.externalId}/${entry.year}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped++;
    }
  }
}
