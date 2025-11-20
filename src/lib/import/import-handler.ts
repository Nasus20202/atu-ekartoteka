import {
  importApartmentsFromBuffer,
  ImportResult,
} from '@/lib/import/apartment-import';
import {
  ChargeImportResult,
  importChargesFromBuffer,
} from '@/lib/import/charge-import';
import {
  importChargeNotifications,
  importPayments,
} from '@/lib/import/notification-payment-import';
import { createLogger } from '@/lib/logger';

const logger = createLogger('import:handler');

export interface ImportFileGroup {
  lokFile?: File;
  chargesFile?: File;
  notificationsFile?: File;
  paymentsFile?: File;
}

export interface HOAImportResult extends ImportResult {
  hoaId: string;
  charges?: {
    created: number;
    updated: number;
    skipped: number;
    total: number;
  };
  notifications?: {
    created: number;
    updated: number;
    deleted: number;
    total: number;
  };
  payments?: {
    created: number;
    updated: number;
    skipped: number;
    total: number;
  };
}

export interface ImportError {
  hoaId?: string;
  file?: string;
  error: string;
}

export interface BatchImportResult {
  success: boolean;
  results: HOAImportResult[];
  errors: ImportError[];
}

export async function processBatchImport(
  files: File[]
): Promise<BatchImportResult> {
  const results: HOAImportResult[] = [];
  const errors: ImportError[] = [];

  // Group files by HOA ID
  const filesByHOA = new Map<string, ImportFileGroup>();

  for (const file of files) {
    try {
      const pathParts = file.name.split('/');
      if (pathParts.length < 2) {
        throw new Error(
          `Nieprawidłowa struktura pliku: ${file.name}. Oczekiwano {ID_WSPÓLNOTY}/lok.txt lub {ID_WSPÓLNOTY}/nal_czynsz.txt`
        );
      }

      const fileName = pathParts[pathParts.length - 1];
      const hoaId = pathParts[pathParts.length - 2];

      if (fileName === 'lok.txt') {
        const entry = filesByHOA.get(hoaId) || {};
        entry.lokFile = file;
        filesByHOA.set(hoaId, entry);
      } else if (fileName === 'nal_czynsz.txt') {
        const entry = filesByHOA.get(hoaId) || {};
        entry.chargesFile = file;
        filesByHOA.set(hoaId, entry);
      } else if (fileName === 'pow_czynsz.txt') {
        const entry = filesByHOA.get(hoaId) || {};
        entry.notificationsFile = file;
        filesByHOA.set(hoaId, entry);
      } else if (fileName === 'wplaty.txt') {
        const entry = filesByHOA.get(hoaId) || {};
        entry.paymentsFile = file;
        filesByHOA.set(hoaId, entry);
      } else if (!fileName.endsWith('.wmb')) {
        throw new Error(
          `Nieprawidłowa nazwa pliku: ${fileName}. Oczekiwano lok.txt, nal_czynsz.txt, pow_czynsz.txt lub wplaty.txt`
        );
      }
    } catch (error) {
      errors.push({
        file: file.name,
        error: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    }
  }

  // Process each HOA
  for (const [
    hoaId,
    { lokFile, chargesFile, notificationsFile, paymentsFile },
  ] of filesByHOA.entries()) {
    try {
      if (!lokFile) {
        throw new Error(
          `Brak pliku lok.txt dla wspólnoty ${hoaId}. Plik lok.txt jest wymagany.`
        );
      }

      logger.info({ hoaId }, 'Starting import for HOA');

      // Import apartments
      logger.info({ hoaId }, 'Importing apartments');
      const lokBytes = await lokFile.arrayBuffer();
      const lokBuffer = Buffer.from(lokBytes);
      const result = await importApartmentsFromBuffer(lokBuffer, hoaId);

      // Import charges if available
      let chargesResult: ChargeImportResult | undefined;
      if (chargesFile) {
        logger.info({ hoaId }, 'Found charges file');
        const chargesBytes = await chargesFile.arrayBuffer();
        const chargesBuffer = Buffer.from(chargesBytes);
        logger.info({ hoaId }, 'Importing charges');
        chargesResult = await importChargesFromBuffer(chargesBuffer, hoaId);
        logger.info(
          {
            hoaId,
            created: chargesResult.created,
            updated: chargesResult.updated,
            skipped: chargesResult.skipped,
          },
          'Charges imported'
        );
      }

      let notificationsBuffer: Buffer | undefined;
      if (notificationsFile) {
        logger.info({ hoaId }, 'Found notifications file');
        const notificationsBytes = await notificationsFile.arrayBuffer();
        notificationsBuffer = Buffer.from(notificationsBytes);
      }

      let paymentsBuffer: Buffer | undefined;
      if (paymentsFile) {
        logger.info({ hoaId }, 'Found payments file');
        const paymentsBytes = await paymentsFile.arrayBuffer();
        paymentsBuffer = Buffer.from(paymentsBytes);
      }

      // Import notifications if available
      let notificationsResult;
      if (notificationsBuffer) {
        logger.info({ hoaId }, 'Importing charge notifications');
        notificationsResult = await importChargeNotifications(
          notificationsBuffer,
          hoaId
        );
        logger.info(
          {
            hoaId,
            created: notificationsResult.created,
            updated: notificationsResult.updated,
            deleted: notificationsResult.deleted,
            total: notificationsResult.total,
          },
          'Notifications imported'
        );
      }

      // Import payments if available
      let paymentsResult;
      if (paymentsBuffer) {
        logger.info({ hoaId }, 'Importing payments');
        paymentsResult = await importPayments(paymentsBuffer, hoaId);
        logger.info(
          {
            hoaId,
            created: paymentsResult.created,
            updated: paymentsResult.updated,
            skipped: paymentsResult.skipped,
            total: paymentsResult.total,
          },
          'Payments imported'
        );
      }

      results.push({
        hoaId,
        ...result,
        charges: chargesResult
          ? {
              created: chargesResult.created,
              updated: chargesResult.updated,
              skipped: chargesResult.skipped,
              total: chargesResult.total,
            }
          : undefined,
        notifications: notificationsResult,
        payments: paymentsResult,
      });

      logger.info({ hoaId }, 'Import completed for HOA');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Nieznany błąd';
      logger.error({ hoaId, error: errorMsg }, 'Import failed for HOA');
      errors.push({
        hoaId,
        error: errorMsg,
      });
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
  };
}
