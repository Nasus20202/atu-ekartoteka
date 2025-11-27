import { EntityStats, TransactionClient } from '@/lib/import/types';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';

type PaymentKey = {
  apartmentId: string;
  year: number;
  externalId: string;
};

type ExistingPayment = PaymentKey & {
  id: string;
  dateFrom: Date;
  dateTo: Date;
  openingBalance: number;
  totalCharges: number;
  closingBalance: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
};

function makePaymentKey(p: PaymentKey): string {
  return `${p.apartmentId}|${p.year}|${p.externalId}`;
}

function hasPaymentChanged(
  existing: ExistingPayment,
  entry: PaymentEntry
): boolean {
  const [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec] =
    entry.monthlyPayments;

  return (
    existing.dateFrom.getTime() !== entry.dateFrom.getTime() ||
    existing.dateTo.getTime() !== entry.dateTo.getTime() ||
    existing.openingBalance !== entry.openingBalance ||
    existing.totalCharges !== entry.totalCharges ||
    existing.closingBalance !== entry.closingBalance ||
    existing.january !== jan ||
    existing.february !== feb ||
    existing.march !== mar ||
    existing.april !== apr ||
    existing.may !== may ||
    existing.june !== jun ||
    existing.july !== jul ||
    existing.august !== aug ||
    existing.september !== sep ||
    existing.october !== oct ||
    existing.november !== nov ||
    existing.december !== dec
  );
}

export async function importPayments(
  tx: TransactionClient,
  apartmentMap: Map<string, string>,
  entries: PaymentEntry[],
  stats: EntityStats,
  errors: string[]
): Promise<void> {
  // Filter entries with valid apartment IDs
  const validEntries = entries
    .map((entry) => ({
      entry,
      apartmentId: apartmentMap.get(entry.apartmentCode),
    }))
    .filter(
      (item): item is { entry: PaymentEntry; apartmentId: string } =>
        item.apartmentId !== undefined
    );

  stats.skipped = entries.length - validEntries.length;

  if (validEntries.length === 0) return;

  // Fetch all existing payments with full data for comparison
  const uniqueKeys = validEntries.map(({ entry, apartmentId }) => ({
    apartmentId,
    year: entry.year,
    externalId: entry.externalId,
  }));

  const existingPayments = await tx.payment.findMany({
    where: {
      OR: uniqueKeys.map((k) => ({
        apartmentId: k.apartmentId,
        year: k.year,
        externalId: k.externalId,
      })),
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
      externalId: entry.externalId,
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
      await tx.payment.createMany({
        data: toCreate.map(({ entry, apartmentId }) => {
          const [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec] =
            entry.monthlyPayments;
          return {
            externalId: entry.externalId,
            apartmentId,
            year: entry.year,
            dateFrom: entry.dateFrom,
            dateTo: entry.dateTo,
            openingBalance: entry.openingBalance,
            totalCharges: entry.totalCharges,
            closingBalance: entry.closingBalance,
            january: jan,
            february: feb,
            march: mar,
            april: apr,
            may: may,
            june: jun,
            july: jul,
            august: aug,
            september: sep,
            october: oct,
            november: nov,
            december: dec,
          };
        }),
        skipDuplicates: true,
      });
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
      const [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec] =
        entry.monthlyPayments;
      await tx.payment.update({
        where: { id },
        data: {
          dateFrom: entry.dateFrom,
          dateTo: entry.dateTo,
          openingBalance: entry.openingBalance,
          totalCharges: entry.totalCharges,
          closingBalance: entry.closingBalance,
          january: jan,
          february: feb,
          march: mar,
          april: apr,
          may: may,
          june: jun,
          july: jul,
          august: aug,
          september: sep,
          october: oct,
          november: nov,
          december: dec,
        },
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
