import type {
  PreparedFile,
  SettlementUpload,
} from '@/lib/settlements/types/prepared-file';
import { prepareSettlementFile } from '@/lib/settlements/use-cases/prepare-settlement-file';
import { addBatchConflicts } from '@/lib/settlements/validation/batch-conflicts';

/** Reads and matches the selected files and compares them with each other. */
export async function prepareSettlementFiles(
  uploads: SettlementUpload[]
): Promise<PreparedFile[]> {
  const files: PreparedFile[] = [];
  // One at a time: reading a printout is the expensive part
  for (const upload of uploads) {
    files.push(await prepareSettlementFile(upload));
  }
  return addBatchConflicts(files);
}
