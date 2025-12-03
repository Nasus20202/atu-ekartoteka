import { PrismaClient } from '@/generated/prisma/client';
import { prisma } from '@/lib/database/prisma';
import {
  importApartments,
  importCharges,
  importNotifications,
  importPayments,
} from '@/lib/import/importers';
import {
  BatchImportResult,
  HOAImportResult,
  ImportError,
  ImportFileGroup,
  TransactionClient,
} from '@/lib/import/types';
import {
  createEmptyStats,
  groupFilesByHOA,
  parseFileToBuffer,
} from '@/lib/import/utils';
import { createLogger } from '@/lib/logger';
import {
  getUniqueApartments,
  parseApartmentBuffer,
} from '@/lib/parsers/apartment-parser';
import { parseNalCzynszBuffer } from '@/lib/parsers/nal-czynsz-parser';
import { parsePowCzynszFile } from '@/lib/parsers/pow-czynsz-parser';
import { parseWplatyFile } from '@/lib/parsers/wplaty-parser';

const logger = createLogger('import:handler');

export type { BatchImportResult, HOAImportResult, ImportError };

export interface ImportOptions {
  cleanImport?: boolean;
}

async function importSingleHOA(
  hoaId: string,
  fileGroup: ImportFileGroup,
  options: ImportOptions = {}
): Promise<HOAImportResult> {
  const result: HOAImportResult = {
    hoaId,
    apartments: createEmptyStats(),
    errors: [],
  };

  const { lokFile, chargesFile, notificationsFile, paymentsFile } = fileGroup;

  // Check if at least one file is present
  if (!lokFile && !chargesFile && !notificationsFile && !paymentsFile) {
    result.errors.push(`Brak plików do importu dla wspólnoty ${hoaId}.`);
    return result;
  }

  try {
    logger.info({ hoaId }, 'Starting import for HOA');

    // Parse all files outside of transaction
    const apartments = lokFile
      ? getUniqueApartments(
          await parseApartmentBuffer(await parseFileToBuffer(lokFile))
        )
      : [];
    result.apartments.total = apartments.length;

    const chargeEntries = chargesFile
      ? await parseNalCzynszBuffer(await parseFileToBuffer(chargesFile))
      : null;
    if (chargeEntries) {
      result.charges = createEmptyStats();
      result.charges.total = chargeEntries.length;
    }

    const notificationData = notificationsFile
      ? await parsePowCzynszFile(await parseFileToBuffer(notificationsFile))
      : null;
    if (notificationData) {
      result.notifications = createEmptyStats();
      result.notifications.total = notificationData.entries.length;
    }

    const paymentData = paymentsFile
      ? await parseWplatyFile(await parseFileToBuffer(paymentsFile))
      : null;
    if (paymentData) {
      result.payments = createEmptyStats();
      result.payments.total = paymentData.entries.length;
    }

    // Execute all database operations in a single transaction
    // Increase timeout to 30s for large imports
    await (prisma as PrismaClient).$transaction(
      async (tx: TransactionClient) => {
        // Upsert HOA
        const hoa = await tx.homeownersAssociation.upsert({
          where: { externalId: hoaId },
          create: { externalId: hoaId, name: hoaId },
          update: {},
        });

        // If clean import, delete all existing charges, notifications, and payments for this HOA
        if (options.cleanImport) {
          logger.info({ hoaId }, 'Clean import: deleting existing data');

          // Get all apartment IDs for this HOA
          const apartmentIds = await tx.apartment.findMany({
            where: { homeownersAssociationId: hoa.id },
            select: { id: true },
          });
          const ids = apartmentIds.map((a: { id: string }) => a.id);

          if (ids.length > 0) {
            // Delete charges
            const deletedCharges = await tx.charge.deleteMany({
              where: { apartmentId: { in: ids } },
            });

            // Delete notifications
            const deletedNotifications = await tx.chargeNotification.deleteMany(
              {
                where: { apartmentId: { in: ids } },
              }
            );

            // Delete payments
            const deletedPayments = await tx.payment.deleteMany({
              where: { apartmentId: { in: ids } },
            });

            logger.info(
              {
                hoaId,
                deletedCharges: deletedCharges.count,
                deletedNotifications: deletedNotifications.count,
                deletedPayments: deletedPayments.count,
              },
              'Clean import: deleted existing data'
            );
          }
        }

        // Process apartments
        const { map: apartmentMap } = await importApartments(
          tx,
          hoa,
          apartments,
          result.apartments,
          result.errors
        );

        // Process charges
        if (chargeEntries && result.charges) {
          await importCharges(
            tx,
            apartmentMap,
            chargeEntries,
            result.charges,
            result.errors
          );
        }

        // Process notifications
        if (notificationData && result.notifications) {
          await importNotifications(
            tx,
            hoa,
            apartmentMap,
            notificationData.entries,
            result.notifications,
            result.errors
          );
        }

        // Process payments
        if (paymentData && result.payments) {
          await importPayments(
            tx,
            apartmentMap,
            paymentData.entries,
            result.payments,
            result.errors
          );
        }
      },
      { timeout: 30000 }
    );

    logger.info(
      {
        hoaId,
        apartments: result.apartments,
        charges: result.charges,
        notifications: result.notifications,
        payments: result.payments,
        errorCount: result.errors.length,
      },
      'Import completed for HOA'
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Nieznany błąd';
    logger.error({ hoaId, error: errorMsg }, 'Transaction failed for HOA');
    result.errors.push(`Błąd transakcji: ${errorMsg}`);
  }

  return result;
}

export async function processBatchImport(
  files: File[],
  options: ImportOptions = {}
): Promise<BatchImportResult> {
  const errors: ImportError[] = [];
  const filesByHOA = groupFilesByHOA(files, errors);

  const hoaImportPromises = Array.from(filesByHOA.entries()).map(
    async ([hoaId, fileGroup]) => {
      try {
        return await importSingleHOA(hoaId, fileGroup, options);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Nieznany błąd';
        logger.error(
          { hoaId, error: errorMsg },
          'Unexpected error during import'
        );
        return {
          hoaId,
          apartments: createEmptyStats(),
          errors: [`Nieoczekiwany błąd: ${errorMsg}`],
        } as HOAImportResult;
      }
    }
  );

  const results = await Promise.all(hoaImportPromises);

  // Collect HOA-level errors into batch errors
  for (const result of results) {
    if (result.errors.length > 0 && result.apartments.total === 0) {
      errors.push({ hoaId: result.hoaId, error: result.errors.join('; ') });
    }
  }

  return {
    success: errors.length === 0 && results.every((r) => r.errors.length === 0),
    results,
    errors,
  };
}
