import { Prisma } from '@/generated/prisma/client';
import { IMPORT_CREATE_BATCH_SIZE } from '@/lib/import/constants';
import { EntityStats, TransactionClient } from '@/lib/import/types';
import { processInBatches } from '@/lib/import/utils';
import { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import { toDecimal } from '@/lib/utils/decimal';

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
  quantity: Prisma.Decimal;
  unit: string;
  unitPrice: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
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
    !toDecimal(existing.quantity).equals(toDecimal(entry.quantity)) ||
    existing.unit !== entry.unit ||
    !toDecimal(existing.unitPrice).equals(toDecimal(entry.unitPrice)) ||
    !toDecimal(existing.totalAmount).equals(toDecimal(entry.totalAmount))
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
  const validEntries: Array<{ entry: NalCzynszEntry; apartmentId: string }> =
    [];
  const apartmentIds = new Set<string>();
  const periods = new Set<string>();
  const lineNumbers = new Set<number>();

  for (const entry of chargeEntries) {
    const apartmentId = apartmentMap.get(
      `${entry.id}#${entry.apartmentExternalId}`
    );
    if (!apartmentId) {
      continue;
    }

    validEntries.push({ entry, apartmentId });
    apartmentIds.add(apartmentId);
    periods.add(entry.period);
    lineNumbers.add(entry.lineNo);
  }

  stats.skipped = chargeEntries.length - validEntries.length;

  if (validEntries.length === 0) return;

  const existingCharges = await tx.charge.findMany({
    where: {
      apartmentId: { in: Array.from(apartmentIds) },
      period: { in: Array.from(periods) },
      externalLineNo: { in: Array.from(lineNumbers) },
    },
    select: {
      id: true,
      apartmentId: true,
      period: true,
      externalLineNo: true,
      dateFrom: true,
      dateTo: true,
      description: true,
      quantity: true,
      unit: true,
      unitPrice: true,
      totalAmount: true,
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
      await processInBatches(
        toCreate,
        IMPORT_CREATE_BATCH_SIZE,
        async (batch) => {
          await tx.charge.createMany({
            data: batch.map(({ entry, apartmentId }) => ({
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
        }
      );
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
