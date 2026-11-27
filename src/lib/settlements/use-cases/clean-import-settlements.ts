import { createLogger } from '@/lib/platform/logging/logger';
import type {
  SettlementConfirmation,
  SettlementImportFileDto,
} from '@/lib/settlements/dto/settlement-import-dto';
import { replaceSettlements } from '@/lib/settlements/mutations/save-settlements';
import type { SettlementImportRun } from '@/lib/settlements/pipeline/import-run-summary';
import { replacedPeriods } from '@/lib/settlements/rules/replaced-periods';
import type {
  CheckedFile,
  PreparedFile,
  SavableRecord,
  SettlementImportOptions,
} from '@/lib/settlements/types/prepared-file';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import { checkSettlementFile } from '@/lib/settlements/use-cases/check-settlement-file';
import { reviewSettlementFile } from '@/lib/settlements/use-cases/review-settlement-file';

const logger = createLogger('settlements:clean-import');

const ABORTED =
  'Czysty import przerwano z powodu błędów w innym pliku. Nic nie zostało usunięte ani zapisane.';
const SAVE_FAILED =
  'Czysty import się nie powiódł. Nic nie zostało usunięte ani zapisane.';

const fileFinding = (
  kind: SettlementIssue['kind'],
  fileName: string,
  message: string
): SettlementIssue => ({ kind, severity: 'error', fileName, message });

const rejected = (
  reports: SettlementImportFileDto[],
  kind: SettlementIssue['kind'],
  message: string
): SettlementImportRun => ({
  response: {
    success: false,
    removed: 0,
    // A file with errors of its own already says why it was not written
    files: reports.map((report) =>
      report.errors.length > 0
        ? report
        : {
            ...report,
            errors: [fileFinding(kind, report.fileName, message)],
          }
    ),
  },
  writes: [],
});

/**
 * Removes the stored settlements of the files' periods and writes the files, but
 * only when every one of them can be written.
 */
export async function cleanImportSettlements(
  prepared: PreparedFile[],
  confirmations: SettlementConfirmation[],
  options: SettlementImportOptions
): Promise<SettlementImportRun> {
  const replaced = replacedPeriods(prepared);
  const checked: CheckedFile[] = [];
  for (const file of prepared) {
    checked.push(await checkSettlementFile(file, { ...options, replaced }));
  }
  const reviews = checked.map((file) =>
    reviewSettlementFile(file, confirmations)
  );
  const reports = reviews.map((review) => review.report);
  if (!reviews.every((review) => review.writable)) {
    return rejected(reports, 'aborted', ABORTED);
  }

  let removed;
  try {
    removed = await replaceSettlements(
      replaced,
      checked.map(({ fileName, records }) => ({
        fileName,
        // Every record of a writable clean import has its apartment
        records: records as SavableRecord[],
      }))
    );
  } catch (error) {
    logger.error({ error }, 'A clean settlement import failed');
    return rejected(reports, 'database', SAVE_FAILED);
  }

  const files = checked.map((file, index) => ({
    ...reports[index],
    imported: true,
    stats: { created: file.records.length, updated: 0, unchanged: 0 },
  }));
  return {
    response: {
      success: true,
      removed: removed.utility + removed.annual,
      files,
    },
    writes: checked.flatMap(({ documentType }, index) =>
      documentType ? [{ documentType, stats: files[index].stats }] : []
    ),
    removed,
  };
}
