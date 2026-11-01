import { validateBalanceDrift } from '@/lib/import/balance-drift-validation';
import { validateCrossYearBalances } from '@/lib/import/cross-year-validation';
import {
  importApartments,
  importCharges,
  importNotifications,
  importPayments,
} from '@/lib/import/importers';
import type { ParsedHoaFiles } from '@/lib/import/parse-hoa-files';
import { buildSkippedRecordWarnings } from '@/lib/import/skipped-records';
import type {
  HOAImportResult,
  ImportOptions,
  TransactionClient,
} from '@/lib/import/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('import:handler');

/** Writes one HOA's parsed data inside the given transaction. */
export async function importHoaInTransaction(
  tx: TransactionClient,
  hoaId: string,
  { apartments, chargeEntries, notificationData, paymentData }: ParsedHoaFiles,
  result: HOAImportResult,
  options: ImportOptions
): Promise<void> {
  // Upsert HOA and update WMB dates
  const hoa = await tx.homeownersAssociation.upsert({
    where: { externalId: hoaId },
    create: { externalId: hoaId, name: hoaId },
    update: {
      ...(result.apartmentsDataDate !== undefined && {
        apartmentsDataDate: result.apartmentsDataDate,
      }),
      ...(result.chargesDataDate !== undefined && {
        chargesDataDate: result.chargesDataDate,
      }),
      ...(result.notificationsDataDate !== undefined && {
        notificationsDataDate: result.notificationsDataDate,
      }),
    },
  });

  if (options.cleanImport) {
    logger.info({ hoaId }, 'Clean import: deleting existing data');

    const deletedCharges = await tx.charge.deleteMany({
      where: {
        apartment: {
          is: { homeownersAssociationId: hoa.id },
        },
      },
    });
    const deletedNotifications = await tx.chargeNotification.deleteMany({
      where: {
        apartment: {
          is: { homeownersAssociationId: hoa.id },
        },
      },
    });
    const deletedPayments = await tx.payment.deleteMany({
      where: {
        apartment: {
          is: { homeownersAssociationId: hoa.id },
        },
      },
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

  const { map: apartmentMap } = await importApartments(
    tx,
    hoa,
    apartments,
    result.apartments,
    result.errors,
    options.now
  );

  if (chargeEntries && result.charges) {
    await importCharges(
      tx,
      apartmentMap,
      chargeEntries,
      result.charges,
      result.errors
    );
  }

  if (notificationData && result.notifications) {
    await importNotifications(
      tx,
      hoa,
      apartmentMap,
      notificationData,
      result.notifications,
      result.errors
    );
  }

  if (paymentData && result.payments) {
    await validateCrossYearBalances(
      tx,
      apartmentMap,
      paymentData.entries,
      result.warnings
    );

    if (!options.skipValidation) {
      await validateBalanceDrift(
        tx,
        apartmentMap,
        paymentData.entries,
        result.warnings
      );
    }

    await importPayments(
      tx,
      apartmentMap,
      paymentData.entries,
      result.payments,
      result.errors
    );
  }

  result.warnings.push(
    ...buildSkippedRecordWarnings(apartmentMap, {
      charges: chargeEntries?.map((e) => ({
        ownerId: e.id,
        apartmentId: e.apartmentExternalId,
      })),
      notifications: notificationData?.entries.map((e) => ({
        ownerId: e.externalId,
        apartmentId: e.apartmentCode,
      })),
      payments: paymentData?.entries.map((e) => ({
        ownerId: e.externalId,
        apartmentId: e.apartmentCode,
      })),
    })
  );
}
