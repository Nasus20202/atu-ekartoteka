import { EntityStats, HOAContext, TransactionClient } from '@/lib/import/types';
import { ChargeNotificationEntry } from '@/lib/parsers/pow-czynsz-parser';

type NotificationKey = {
  apartmentId: string;
  lineNo: number;
  externalId: string;
};

type ExistingNotification = NotificationKey & {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
};

function makeNotificationKey(n: NotificationKey): string {
  return `${n.apartmentId}|${n.lineNo}|${n.externalId}`;
}

function hasNotificationChanged(
  existing: ExistingNotification,
  entry: ChargeNotificationEntry
): boolean {
  return (
    existing.description !== entry.description ||
    existing.quantity !== entry.quantity ||
    existing.unit !== entry.unit ||
    existing.unitPrice !== entry.unitPrice ||
    existing.totalAmount !== entry.totalAmount
  );
}

export async function importNotifications(
  tx: TransactionClient,
  hoa: HOAContext,
  apartmentMap: Map<string, string>,
  entries: ChargeNotificationEntry[],
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
      (item): item is { entry: ChargeNotificationEntry; apartmentId: string } =>
        item.apartmentId !== undefined
    );

  stats.skipped = entries.length - validEntries.length;

  const notificationsInFile = new Set<string>(
    validEntries.map(({ entry, apartmentId }) =>
      makeNotificationKey({
        apartmentId,
        lineNo: entry.lineNo,
        externalId: entry.externalId,
      })
    )
  );

  if (validEntries.length === 0) {
    // Still need to delete stale notifications even if no new ones
    await deleteStaleNotifications(tx, hoa, notificationsInFile, stats);
    return;
  }

  // Fetch all existing notifications with full data for comparison
  const uniqueKeys = validEntries.map(({ entry, apartmentId }) => ({
    apartmentId,
    lineNo: entry.lineNo,
    externalId: entry.externalId,
  }));

  const existingNotifications = await tx.chargeNotification.findMany({
    where: {
      OR: uniqueKeys.map((k) => ({
        apartmentId: k.apartmentId,
        lineNo: k.lineNo,
        externalId: k.externalId,
      })),
    },
  });

  const existingMap = new Map<string, ExistingNotification>(
    existingNotifications.map((n: ExistingNotification) => [
      makeNotificationKey(n),
      n,
    ])
  );

  const toCreate: Array<{
    entry: ChargeNotificationEntry;
    apartmentId: string;
  }> = [];
  const toUpdate: Array<{ id: string; entry: ChargeNotificationEntry }> = [];

  for (const { entry, apartmentId } of validEntries) {
    const key = makeNotificationKey({
      apartmentId,
      lineNo: entry.lineNo,
      externalId: entry.externalId,
    });
    const existing = existingMap.get(key);

    if (existing) {
      if (hasNotificationChanged(existing, entry)) {
        toUpdate.push({ id: existing.id, entry });
      }
      // If not changed, skip
    } else {
      toCreate.push({ entry, apartmentId });
    }
  }

  // Batch create new notifications
  if (toCreate.length > 0) {
    try {
      await tx.chargeNotification.createMany({
        data: toCreate.map(({ entry, apartmentId }) => ({
          externalId: entry.externalId,
          apartmentId,
          lineNo: entry.lineNo,
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
        `Błąd tworzenia powiadomień: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped += toCreate.length;
    }
  }

  // Update only changed notifications
  for (const { id, entry } of toUpdate) {
    try {
      await tx.chargeNotification.update({
        where: { id },
        data: {
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
        `Błąd aktualizacji powiadomienia ${entry.externalId}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped++;
    }
  }

  // Delete stale notifications
  await deleteStaleNotifications(tx, hoa, notificationsInFile, stats);
}

async function deleteStaleNotifications(
  tx: TransactionClient,
  hoa: HOAContext,
  notificationsInFile: Set<string>,
  stats: EntityStats
): Promise<void> {
  const existingNotifications = await tx.chargeNotification.findMany({
    where: { apartment: { homeownersAssociationId: hoa.id } },
    select: {
      id: true,
      apartmentId: true,
      lineNo: true,
      externalId: true,
    },
  });

  const toDelete = existingNotifications
    .filter(
      (n: NotificationKey & { id: string }) =>
        !notificationsInFile.has(makeNotificationKey(n))
    )
    .map((n: NotificationKey & { id: string }) => n.id);

  if (toDelete.length > 0) {
    await tx.chargeNotification.deleteMany({
      where: { id: { in: toDelete } },
    });
    stats.deleted = toDelete.length;
  }
}
