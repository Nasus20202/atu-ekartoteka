import { IMPORT_CREATE_BATCH_SIZE } from '@/lib/import/constants';
import {
  buildPaymentData,
  type ExistingPayment,
  hasPaymentChanged,
  makePaymentKey,
} from '@/lib/import/importers/payment-data';
import {
  EntityStats,
  ImportErrorItem,
  TransactionClient,
} from '@/lib/import/types';
import { processInBatches } from '@/lib/import/utils';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import { getErrorMessage } from '@/lib/utils/error-message';

export async function importPayments(
  tx: TransactionClient,
  apartmentMap: Map<string, string>,
  entries: PaymentEntry[],
  stats: EntityStats,
  errors: ImportErrorItem[]
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
      legacyClosingBalance: true,
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
      legacyJanuaryCharges: true,
      legacyFebruaryCharges: true,
      legacyMarchCharges: true,
      legacyAprilCharges: true,
      legacyMayCharges: true,
      legacyJuneCharges: true,
      legacyJulyCharges: true,
      legacyAugustCharges: true,
      legacySeptemberCharges: true,
      legacyOctoberCharges: true,
      legacyNovemberCharges: true,
      legacyDecemberCharges: true,
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
      errors.push({
        kind: 'database',
        message: `Błąd tworzenia płatności: ${getErrorMessage(error)}`,
      });
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
      errors.push({
        kind: 'database',
        message: `Błąd aktualizacji płatności ${entry.externalId}/${entry.year}: ${getErrorMessage(error)}`,
      });
      stats.skipped++;
    }
  }
}
