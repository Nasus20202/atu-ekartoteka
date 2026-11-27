import {
  fileIssues,
  type SettlementConfirmation,
  type SettlementImportFileDto,
} from '@/lib/settlements/dto/settlement-import-dto';
import type { CheckedFile } from '@/lib/settlements/types/prepared-file';
import { findMissingConfirmations } from '@/lib/settlements/validation/confirmations';

const NOTHING_WRITTEN = { created: 0, updated: 0, unchanged: 0 };

/**
 * The file as not yet written: its findings, with every missing confirmation,
 * and whether they let it be written.
 */
export function reviewSettlementFile(
  file: CheckedFile,
  confirmations: SettlementConfirmation[]
) {
  const { errors, warnings } = fileIssues(file);
  errors.push(...findMissingConfirmations(file, confirmations));
  const report: SettlementImportFileDto = {
    fileName: file.fileName,
    imported: false,
    stats: NOTHING_WRITTEN,
    errors,
    warnings,
  };
  return {
    report,
    writable: errors.length === 0 && file.records.length > 0,
  };
}
