import { PrismaClient } from '@/generated/prisma/client';
import { prisma } from '@/lib/database/prisma';
import { IMPORT_HOA_CONCURRENCY } from '@/lib/import/constants';
import { importHoaInTransaction } from '@/lib/import/import-hoa-transaction';
import { parseHoaFiles } from '@/lib/import/parse-hoa-files';
import {
  BatchImportResult,
  HOAImportResult,
  ImportError,
  ImportFileGroup,
  ImportOptions,
  TransactionClient,
} from '@/lib/import/types';
import {
  createEmptyStats,
  groupFilesByHOA,
  mapWithConcurrency,
} from '@/lib/import/utils';
import { validateHoaFiles } from '@/lib/import/validate-hoa-files';
import { createLogger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils/error-message';

const IMPORT_TRANSACTION_TIMEOUT_MS = 60000;

const logger = createLogger('import:handler');

export type { BatchImportResult, HOAImportResult, ImportError, ImportOptions };

async function importSingleHOA(
  hoaId: string,
  fileGroup: ImportFileGroup,
  options: ImportOptions = {}
): Promise<HOAImportResult> {
  const result: HOAImportResult = {
    hoaId,
    apartments: createEmptyStats(),
    errors: [],
    warnings: [],
  };

  const { lokFiles, chargesFiles, notificationsFiles, paymentsFiles } =
    fileGroup;
  if (!lokFiles && !chargesFiles && !notificationsFiles && !paymentsFiles) {
    result.errors.push({
      kind: 'missing-files',
      message: `Brak plików do importu dla wspólnoty ${hoaId}.`,
    });
    return result;
  }

  try {
    logger.info({ hoaId }, 'Starting import for HOA');

    const parsed = await parseHoaFiles(fileGroup, result);
    if (!validateHoaFiles(parsed, result, options)) {
      return result;
    }

    await (prisma as PrismaClient).$transaction(
      (tx: TransactionClient) =>
        importHoaInTransaction(tx, hoaId, parsed, result, options),
      { timeout: IMPORT_TRANSACTION_TIMEOUT_MS }
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
    const errorMsg = getErrorMessage(error);
    logger.error({ hoaId, error: errorMsg }, 'Transaction failed for HOA');
    result.errors.push({
      kind: 'transaction',
      message: `Błąd transakcji: ${errorMsg}`,
    });
  }

  return result;
}

export async function processBatchImport(
  files: File[],
  options: ImportOptions = {}
): Promise<BatchImportResult> {
  const errors: ImportError[] = [];
  const filesByHOA = groupFilesByHOA(files, errors);

  const hoaEntries = Array.from(filesByHOA.entries());

  const results = await mapWithConcurrency(
    hoaEntries,
    IMPORT_HOA_CONCURRENCY,
    ([hoaId, fileGroup]) => importSingleHOA(hoaId, fileGroup, options)
  );

  for (const result of results) {
    if (result.errors.length > 0 && result.apartments.total === 0) {
      errors.push(
        ...result.errors.map((error) => ({ ...error, hoaId: result.hoaId }))
      );
    }
  }

  return {
    success: errors.length === 0 && results.every((r) => r.errors.length === 0),
    results,
    errors,
  };
}
