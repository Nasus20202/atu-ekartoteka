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

      console.log(`Starting import for HOA ${hoaId}...`);

      // Import apartments
      console.log(`Importing apartments for HOA ${hoaId}...`);
      const lokBytes = await lokFile.arrayBuffer();
      const lokBuffer = Buffer.from(lokBytes);
      const result = await importApartmentsFromBuffer(lokBuffer, hoaId);

      // Import charges if available
      let chargesResult: ChargeImportResult | undefined;
      if (chargesFile) {
        console.log(`Found charges file for HOA ${hoaId}`);
        const chargesBytes = await chargesFile.arrayBuffer();
        const chargesBuffer = Buffer.from(chargesBytes);
        console.log(`Importing charges for HOA ${hoaId}...`);
        chargesResult = await importChargesFromBuffer(chargesBuffer, hoaId);
        console.log(
          `Imported ${chargesResult.created} charges, updated ${chargesResult.updated}, skipped ${chargesResult.skipped}`
        );
      }

      let notificationsBuffer: Buffer | undefined;
      if (notificationsFile) {
        console.log(`Found notifications file for HOA ${hoaId}`);
        const notificationsBytes = await notificationsFile.arrayBuffer();
        notificationsBuffer = Buffer.from(notificationsBytes);
      }

      let paymentsBuffer: Buffer | undefined;
      if (paymentsFile) {
        console.log(`Found payments file for HOA ${hoaId}`);
        const paymentsBytes = await paymentsFile.arrayBuffer();
        paymentsBuffer = Buffer.from(paymentsBytes);
      }

      // Import notifications if available
      let notificationsResult;
      if (notificationsBuffer) {
        console.log(`Importing charge notifications for HOA ${hoaId}...`);
        notificationsResult = await importChargeNotifications(
          notificationsBuffer,
          hoaId
        );
        console.log(
          `Notifications: ${notificationsResult.created} created, ${notificationsResult.updated} updated, ${notificationsResult.deleted} deleted, ${notificationsResult.total} total`
        );
      }

      // Import payments if available
      let paymentsResult;
      if (paymentsBuffer) {
        console.log(`Importing payments for HOA ${hoaId}...`);
        paymentsResult = await importPayments(paymentsBuffer, hoaId);
        console.log(
          `Payments: ${paymentsResult.created} created, ${paymentsResult.updated} updated, ${paymentsResult.skipped} skipped, ${paymentsResult.total} total`
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

      console.log(`Import completed for HOA ${hoaId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Nieznany błąd';
      console.error(`Import failed for HOA ${hoaId}: ${errorMsg}`);
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
