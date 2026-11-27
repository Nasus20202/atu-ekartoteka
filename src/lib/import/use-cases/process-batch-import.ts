import { PrismaClient } from '@/generated/prisma/client';
import { importHoaInTransaction } from '@/lib/import/pipeline/import-hoa-transaction';
import { dataImportSummary } from '@/lib/import/pipeline/import-run-summary';
import { parseHoaFiles } from '@/lib/import/pipeline/parse-hoa-files';
import { validateHoaFiles } from '@/lib/import/pipeline/validate-hoa-files';
import { IMPORT_HOA_CONCURRENCY } from '@/lib/import/rules/constants';
import {
  createEmptyStats,
  groupFilesByHOA,
  mapWithConcurrency,
} from '@/lib/import/rules/utils';
import { TransactionClient } from '@/lib/import/types/import-context';
import { ImportError } from '@/lib/import/types/import-error';
import {
  ImportFileGroup,
  ImportOptions,
} from '@/lib/import/types/import-options';
import {
  BatchImportResult,
  HOAImportResult,
} from '@/lib/import/types/import-result';
import { prisma } from '@/lib/platform/database/prisma';
import { createLogger } from '@/lib/platform/logging/logger';
import {
  IMPORT_METRIC_TYPE,
  measureImportRun,
} from '@/lib/platform/opentelemetry/import-metrics';
import { getErrorMessage } from '@/lib/shared/utils/error-message';

const IMPORT_TRANSACTION_TIMEOUT_MS = 60000;

const logger = createLogger('import:handler');

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
    logger.error({ hoaId, error }, 'Transaction failed for HOA');
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
  return measureImportRun(
    IMPORT_METRIC_TYPE.DATA,
    () => runBatchImport(files, options),
    dataImportSummary
  );
}

async function runBatchImport(
  files: File[],
  options: ImportOptions
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
