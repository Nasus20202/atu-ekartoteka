import {
  IMPORT_METRIC_TYPE,
  measureImportRun,
} from '@/lib/platform/opentelemetry/import-metrics';
import {
  type SettlementPreviewFileDto,
  type SettlementPreviewResponse,
  toPreviewFile,
} from '@/lib/settlements/dto/settlement-import-dto';
import { settlementPreviewSummary } from '@/lib/settlements/pipeline/import-run-summary';
import { countReplacedSettlements } from '@/lib/settlements/queries/count-replaced-settlements';
import { STANDARD_IMPORT } from '@/lib/settlements/rules/import-options';
import { replacedPeriods } from '@/lib/settlements/rules/replaced-periods';
import type {
  SettlementImportOptions,
  SettlementUpload,
} from '@/lib/settlements/types/prepared-file';
import { checkSettlementFile } from '@/lib/settlements/use-cases/check-settlement-file';
import { prepareSettlementFiles } from '@/lib/settlements/use-cases/prepare-settlement-files';

/** Reports what an import of the files would do, without writing anything. */
export async function previewSettlements(
  uploads: SettlementUpload[],
  options = STANDARD_IMPORT
): Promise<SettlementPreviewResponse> {
  return measureImportRun(
    IMPORT_METRIC_TYPE.SETTLEMENT_PREVIEW,
    () => runPreview(uploads, options),
    settlementPreviewSummary
  );
}

async function runPreview(
  uploads: SettlementUpload[],
  options: SettlementImportOptions
): Promise<SettlementPreviewResponse> {
  const prepared = await prepareSettlementFiles(uploads);
  const replaced = options.cleanImport ? replacedPeriods(prepared) : [];
  const files: SettlementPreviewFileDto[] = [];
  for (const file of prepared) {
    const checked = await checkSettlementFile(file, { ...options, replaced });
    files.push(toPreviewFile(checked));
  }
  return { files, removals: await countReplacedSettlements(replaced) };
}
