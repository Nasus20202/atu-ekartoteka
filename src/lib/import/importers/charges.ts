import { EntityStats, TransactionClient } from '@/lib/import/types';
import { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';

type ChargeKey = {
  apartmentId: string;
  period: string;
  externalLineNo: number;
};

type ExistingCharge = ChargeKey & {
  id: string;
  dateFrom: Date;
  dateTo: Date;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
};

function makeChargeKey(c: ChargeKey): string {
  return `${c.apartmentId}|${c.period}|${c.externalLineNo}`;
}

function hasChargeChanged(
  existing: ExistingCharge,
  entry: NalCzynszEntry
): boolean {
  return (
    existing.dateFrom.getTime() !== entry.dateFrom.getTime() ||
    existing.dateTo.getTime() !== entry.dateTo.getTime() ||
    existing.description !== entry.description ||
    existing.quantity !== entry.quantity ||
    existing.unit !== entry.unit ||
    existing.unitPrice !== entry.unitPrice ||
    existing.totalAmount !== entry.totalAmount
  );
}

export async function importCharges(
  tx: TransactionClient,
  apartmentMap: Map<string, string>,
  chargeEntries: NalCzynszEntry[],
  stats: EntityStats,
  errors: string[]
): Promise<void> {
  // Filter entries with valid apartment IDs (using combined key: externalOwnerId#externalApartmentId)
  const validEntries = chargeEntries
    .map((entry) => ({
      entry,
      apartmentId: apartmentMap.get(`${entry.id}#${entry.apartmentExternalId}`),
    }))
    .filter(
      (item): item is { entry: NalCzynszEntry; apartmentId: string } =>
        item.apartmentId !== undefined
    );

  stats.skipped = chargeEntries.length - validEntries.length;

  if (validEntries.length === 0) return;

  // Fetch all existing charges with full data for comparison
  const uniqueKeys = validEntries.map(({ entry, apartmentId }) => ({
    apartmentId,
    period: entry.period,
    externalLineNo: entry.lineNo,
  }));

  const existingCharges = await tx.charge.findMany({
    where: {
      OR: uniqueKeys.map((k) => ({
        apartmentId: k.apartmentId,
        period: k.period,
        externalLineNo: k.externalLineNo,
      })),
    },
  });

  const existingMap = new Map<string, ExistingCharge>(
    existingCharges.map((c: ExistingCharge) => [makeChargeKey(c), c])
  );

  const toCreate: Array<{ entry: NalCzynszEntry; apartmentId: string }> = [];
  const toUpdate: Array<{ id: string; entry: NalCzynszEntry }> = [];

  for (const { entry, apartmentId } of validEntries) {
    const key = makeChargeKey({
      apartmentId,
      period: entry.period,
      externalLineNo: entry.lineNo,
    });
    const existing = existingMap.get(key);

    if (existing) {
      if (hasChargeChanged(existing, entry)) {
        toUpdate.push({ id: existing.id, entry });
      }
      // If not changed, skip
    } else {
      toCreate.push({ entry, apartmentId });
    }
  }

  // Batch create new charges
  if (toCreate.length > 0) {
    try {
      await tx.charge.createMany({
        data: toCreate.map(({ entry, apartmentId }) => ({
          externalLineNo: entry.lineNo,
          apartmentId,
          period: entry.period,
          dateFrom: entry.dateFrom,
          dateTo: entry.dateTo,
          description: entry.description,
          quantity: entry.quantity,
          unit: entry.unit,
          unitPrice: entry.unitPrice,
          totalAmount: entry.totalAmount,
        })),
        skipDuplicates: true,
      });
      stats.created = toCreate.length;
    } catch (error) {
      errors.push(
        `Błąd tworzenia naliczeń: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped += toCreate.length;
    }
  }

  // Update only changed charges
  for (const { id, entry } of toUpdate) {
    try {
      await tx.charge.update({
        where: { id },
        data: {
          dateFrom: entry.dateFrom,
          dateTo: entry.dateTo,
          description: entry.description,
          quantity: entry.quantity,
          unit: entry.unit,
          unitPrice: entry.unitPrice,
          totalAmount: entry.totalAmount,
        },
      });
      stats.updated++;
    } catch (error) {
      errors.push(
        `Błąd aktualizacji naliczenia ${entry.id}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped++;
    }
  }
}
