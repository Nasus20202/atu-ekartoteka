import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { parsePowCzynszFile } from '@/lib/parsers/pow-czynsz-parser';
import { parseWplatyFile } from '@/lib/parsers/wplaty-parser';

const logger = createLogger('import:notifications-payments');

export const importChargeNotifications = async (
  buffer: Buffer,
  hoaExternalId: string
): Promise<{
  created: number;
  updated: number;
  deleted: number;
  total: number;
}> => {
  const { entries } = await parsePowCzynszFile(buffer);

  let created = 0;
  let updated = 0;
  let deleted = 0;

  // Resolve HOA once before processing
  const hoa = await prisma.homeownersAssociation.findUnique({
    where: { externalId: hoaExternalId },
    select: { id: true },
  });

  if (!hoa) {
    logger.error(
      { hoaExternalId },
      'Charge notification import failed: HOA not found'
    );
    return { created: 0, updated: 0, deleted: 0, total: entries.length };
  }

  logger.info(
    { hoaExternalId, entryCount: entries.length },
    'Starting charge notification import'
  );

  // Get all apartments for this HOA once
  const apartments = await prisma.apartment.findMany({
    where: {
      homeownersAssociationId: hoa.id,
      isActive: true,
    },
    select: {
      id: true,
      externalId: true,
    },
  });

  const apartmentMap = new Map(
    apartments.map((apt) => [apt.externalId, apt.id])
  );

  // Get existing notifications to determine creates vs updates
  const existingNotifications = await prisma.chargeNotification.findMany({
    where: {
      apartment: {
        homeownersAssociationId: hoa.id,
      },
    },
    select: {
      apartmentId: true,
      lineNo: true,
      id: true,
    },
  });

  const existingMap = new Map(
    existingNotifications.map((n) => [`${n.apartmentId}-${n.lineNo}`, n.id])
  );

  const toCreate: Array<{
    externalId: string;
    apartmentId: string;
    lineNo: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
  }> = [];

  const toUpdate: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
  }> = [];

  // Track which notifications should exist (from the file)
  const notificationsInFile = new Set<string>();

  for (const entry of entries) {
    const apartmentId = apartmentMap.get(entry.apartmentCode);

    if (!apartmentId) {
      continue;
    }

    const key = `${apartmentId}-${entry.lineNo}`;
    notificationsInFile.add(key);
    const existingId = existingMap.get(key);

    if (existingId) {
      toUpdate.push({
        id: existingId,
        description: entry.description,
        quantity: entry.quantity,
        unit: entry.unit,
        unitPrice: entry.unitPrice,
        totalAmount: entry.totalAmount,
      });
    } else {
      toCreate.push({
        externalId: entry.externalId,
        apartmentId,
        lineNo: entry.lineNo,
        description: entry.description,
        quantity: entry.quantity,
        unit: entry.unit,
        unitPrice: entry.unitPrice,
        totalAmount: entry.totalAmount,
      });
    }
  }

  // Find notifications to delete (exist in DB but not in file)
  const toDelete = existingNotifications
    .filter((n) => !notificationsInFile.has(`${n.apartmentId}-${n.lineNo}`))
    .map((n) => n.id);

  // Bulk create
  if (toCreate.length > 0) {
    await prisma.chargeNotification.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    created = toCreate.length;
  }

  // Bulk update in batches
  if (toUpdate.length > 0) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((notification) =>
          prisma.chargeNotification.update({
            where: { id: notification.id },
            data: {
              description: notification.description,
              quantity: notification.quantity,
              unit: notification.unit,
              unitPrice: notification.unitPrice,
              totalAmount: notification.totalAmount,
            },
          })
        )
      );
    }
    updated = toUpdate.length;
  }

  // Bulk delete
  if (toDelete.length > 0) {
    await prisma.chargeNotification.deleteMany({
      where: {
        id: { in: toDelete },
      },
    });
    deleted = toDelete.length;
  }

  const total = entries.length;

  logger.info(
    { hoaExternalId, created, updated, deleted, total },
    'Charge notification import completed'
  );

  return { created, updated, deleted, total };
};

export const importPayments = async (
  buffer: Buffer,
  hoaExternalId: string
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  total: number;
}> => {
  const { entries } = await parseWplatyFile(buffer);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Resolve HOA once before processing
  const hoa = await prisma.homeownersAssociation.findUnique({
    where: { externalId: hoaExternalId },
    select: { id: true },
  });

  if (!hoa) {
    logger.error({ hoaExternalId }, 'Payment import failed: HOA not found');
    return {
      created: 0,
      updated: 0,
      skipped: entries.length,
      total: entries.length,
    };
  }

  logger.info(
    { hoaExternalId, entryCount: entries.length },
    'Starting payment import'
  );

  // Get all apartments for this HOA once
  const apartments = await prisma.apartment.findMany({
    where: {
      homeownersAssociationId: hoa.id,
      isActive: true,
    },
    select: {
      id: true,
      externalId: true,
    },
  });

  const apartmentMap = new Map(
    apartments.map((apt) => [apt.externalId, apt.id])
  );

  // Get existing payments to determine creates vs updates
  const existingPayments = await prisma.payment.findMany({
    where: {
      apartment: {
        homeownersAssociationId: hoa.id,
      },
    },
    select: {
      apartmentId: true,
      year: true,
      id: true,
    },
  });

  const existingMap = new Map(
    existingPayments.map((p) => [`${p.apartmentId}-${p.year}`, p.id])
  );

  const toCreate: Array<{
    externalId: string;
    apartmentId: string;
    year: number;
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
  }> = [];

  const toUpdate: Array<{
    id: string;
    externalId: string;
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
  }> = [];

  for (const entry of entries) {
    const apartmentId = apartmentMap.get(entry.apartmentCode);

    if (!apartmentId) {
      skipped++;
      continue;
    }

    const [
      january,
      february,
      march,
      april,
      may,
      june,
      july,
      august,
      september,
      october,
      november,
      december,
    ] = entry.monthlyPayments;

    const existingId = existingMap.get(`${apartmentId}-${entry.year}`);

    if (existingId) {
      toUpdate.push({
        id: existingId,
        externalId: entry.externalId,
        dateFrom: entry.dateFrom,
        dateTo: entry.dateTo,
        openingBalance: entry.openingBalance,
        totalCharges: entry.totalCharges,
        closingBalance: entry.closingBalance,
        january,
        february,
        march,
        april,
        may,
        june,
        july,
        august,
        september,
        october,
        november,
        december,
      });
    } else {
      toCreate.push({
        externalId: entry.externalId,
        apartmentId,
        year: entry.year,
        dateFrom: entry.dateFrom,
        dateTo: entry.dateTo,
        openingBalance: entry.openingBalance,
        totalCharges: entry.totalCharges,
        closingBalance: entry.closingBalance,
        january,
        february,
        march,
        april,
        may,
        june,
        july,
        august,
        september,
        october,
        november,
        december,
      });
    }
  }

  // Bulk create
  if (toCreate.length > 0) {
    await prisma.payment.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    created = toCreate.length;
  }

  // Bulk update in batches
  if (toUpdate.length > 0) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((payment) =>
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              externalId: payment.externalId,
              dateFrom: payment.dateFrom,
              dateTo: payment.dateTo,
              openingBalance: payment.openingBalance,
              totalCharges: payment.totalCharges,
              closingBalance: payment.closingBalance,
              january: payment.january,
              february: payment.february,
              march: payment.march,
              april: payment.april,
              may: payment.may,
              june: payment.june,
              july: payment.july,
              august: payment.august,
              september: payment.september,
              october: payment.october,
              november: payment.november,
              december: payment.december,
            },
          })
        )
      );
    }
    updated = toUpdate.length;
  }

  const total = entries.length;

  if (skipped > 0) {
    logger.warn(
      { hoaExternalId, skipped },
      'Payment import: entries skipped (apartments not found)'
    );
  }

  logger.info(
    { hoaExternalId, created, updated, skipped, total },
    'Payment import completed'
  );

  return { created, updated, skipped, total };
};
