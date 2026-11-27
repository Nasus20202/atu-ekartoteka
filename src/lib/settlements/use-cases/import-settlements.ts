import { createLogger } from '@/lib/platform/logging/logger';
import {
  IMPORT_METRIC_TYPE,
  measureImportRun,
} from '@/lib/platform/opentelemetry/import-metrics';
import {
  type SettlementConfirmation,
  type SettlementImportFileDto,
  type SettlementImportResponse,
} from '@/lib/settlements/dto/settlement-import-dto';
import { saveSettlements } from '@/lib/settlements/mutations/save-settlements';
import {
  type SettlementImportRun,
  settlementImportSummary,
  type SettlementWrite,
} from '@/lib/settlements/pipeline/import-run-summary';
import { STANDARD_IMPORT } from '@/lib/settlements/rules/import-options';
import type {
  CheckedFile,
  CheckedRecord,
  SavableRecord,
  SettlementImportOptions,
  SettlementUpload,
} from '@/lib/settlements/types/prepared-file';
import { checkSettlementFile } from '@/lib/settlements/use-cases/check-settlement-file';
import { cleanImportSettlements } from '@/lib/settlements/use-cases/clean-import-settlements';
import { prepareSettlementFiles } from '@/lib/settlements/use-cases/prepare-settlement-files';
import { reviewSettlementFile } from '@/lib/settlements/use-cases/review-settlement-file';

const logger = createLogger('settlements:import');

const isSavable = (record: CheckedRecord): record is SavableRecord =>
  record.status !== 'unchanged' && record.apartment !== null;

async function importFile(
  file: CheckedFile,
  confirmations: SettlementConfirmation[]
): Promise<SettlementImportFileDto> {
  const { report: rejected, writable } = reviewSettlementFile(
    file,
    confirmations
  );
  if (!writable) return rejected;

  const count = (status: string) =>
    file.records.filter((r) => r.status === status).length;
  try {
    await saveSettlements(file.records.filter(isSavable), file.fileName);
  } catch (error) {
    logger.error({ error }, 'Saving a settlement file failed');
    rejected.errors.push({
      kind: 'database',
      severity: 'error',
      fileName: file.fileName,
      message:
        'Nie udało się zapisać pliku. Ponów podgląd i spróbuj jeszcze raz.',
    });
    return rejected;
  }

  return {
    ...rejected,
    imported: true,
    stats: {
      created: count('new'),
      updated: count('changed'),
      unchanged: count('unchanged'),
    },
  };
}

/**
 * Reads and checks the files again and writes each one that has no error and
 * has every confirmation it needs. A clean import writes all of them or none.
 */
export async function importSettlements(
  uploads: SettlementUpload[],
  confirmations: SettlementConfirmation[],
  options = STANDARD_IMPORT
): Promise<SettlementImportResponse> {
  const { response } = await measureImportRun(
    IMPORT_METRIC_TYPE.SETTLEMENT,
    () => runImport(uploads, confirmations, options),
    settlementImportSummary
  );
  return response;
}

async function runImport(
  uploads: SettlementUpload[],
  confirmations: SettlementConfirmation[],
  options: SettlementImportOptions
): Promise<SettlementImportRun> {
  const prepared = await prepareSettlementFiles(uploads);
  if (options.cleanImport) {
    return cleanImportSettlements(prepared, confirmations, options);
  }

  const files: SettlementImportFileDto[] = [];
  const writes: SettlementWrite[] = [];
  // Each file is checked after the previous one is stored
  for (const file of prepared) {
    const checked = await checkSettlementFile(file, {
      ...options,
      replaced: [],
    });
    const dto = await importFile(checked, confirmations);
    files.push(dto);
    if (dto.imported && checked.documentType) {
      writes.push({ documentType: checked.documentType, stats: dto.stats });
    }
  }
  return {
    response: {
      success: files.every((file) => file.imported),
      removed: 0,
      files,
    },
    writes,
  };
}
