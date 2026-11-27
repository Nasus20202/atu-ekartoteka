import {
  findStoredAnnualContent,
  findStoredUtilityContent,
} from '@/lib/settlements/queries/find-stored-settlement';
import { relaxIssues } from '@/lib/settlements/rules/finding-severity';
import { canonicalContent } from '@/lib/settlements/rules/record-content';
import { recordKey } from '@/lib/settlements/rules/record-key';
import type {
  CheckedFile,
  CheckedRecord,
  MatchedRecord,
  PreparedFile,
  SettlementImportOptions,
  SettlementRecordStatus,
} from '@/lib/settlements/types/prepared-file';
import type { ReplacedPeriods } from '@/lib/settlements/types/stored-data';
import { checkRecordAgainstData } from '@/lib/settlements/use-cases/check-record-against-data';
import { checkAnnualRecord } from '@/lib/settlements/validation/annual-consistency';
import {
  type IssueContext,
  recordSubject,
} from '@/lib/settlements/validation/issues';
import { checkUtilityConsistency } from '@/lib/settlements/validation/utility-consistency';
import { checkUtilityWarnings } from '@/lib/settlements/validation/utility-warnings';

const checkContent = (entry: MatchedRecord, context: IssueContext) =>
  entry.type === 'utility'
    ? [
        ...checkUtilityConsistency(entry.record, context),
        ...checkUtilityWarnings(entry.record, context),
      ]
    : checkAnnualRecord(entry.record, context);

async function compareWithStored(
  entry: MatchedRecord,
  apartmentId: string
): Promise<SettlementRecordStatus> {
  const find =
    entry.type === 'utility'
      ? findStoredUtilityContent
      : findStoredAnnualContent;
  const stored = await find(apartmentId, entry.record);
  if (!stored) return 'new';
  return canonicalContent(stored) === canonicalContent(entry.record)
    ? 'unchanged'
    : 'changed';
}

interface CheckSettings extends SettlementImportOptions {
  /** What a clean import removes; empty otherwise */
  replaced: ReplacedPeriods[];
}

async function checkRecord(
  entry: MatchedRecord,
  fileName: string,
  { cleanImport, skipValidation, replaced }: CheckSettings
): Promise<CheckedRecord> {
  const { apartment, record } = entry;
  const context = {
    fileName,
    apartmentExternalId: apartment?.externalApartmentId,
    subject: recordSubject(entry.apartmentLabel, record),
  };
  const found = [
    ...entry.issues,
    ...checkContent(entry, context),
    ...(apartment
      ? await checkRecordAgainstData(entry, apartment, context, replaced)
      : []),
  ];
  const issues = skipValidation ? relaxIssues(found) : found;
  const blocked = !apartment || issues.some((i) => i.severity === 'error');
  // A clean import removes what is stored, so every record of it is new
  const status = blocked
    ? 'blocked'
    : cleanImport
      ? 'new'
      : await compareWithStored(entry, apartment.id);
  const written = status === 'new' || status === 'changed';

  return {
    ...entry,
    issues,
    key: recordKey(entry),
    status,
    confirmations: written
      ? [
          ...(entry.annotated ? (['owner-annotation'] as const) : []),
          ...(status === 'changed' ? (['replace'] as const) : []),
        ]
      : [],
  };
}

/** Runs every check of a prepared file against the current data. */
export async function checkSettlementFile(
  file: PreparedFile,
  settings: CheckSettings
): Promise<CheckedFile> {
  const records: CheckedRecord[] = [];
  for (const entry of file.records) {
    records.push(await checkRecord(entry, file.fileName, settings));
  }
  const issues = settings.skipValidation
    ? relaxIssues(file.issues)
    : file.issues;
  return { ...file, issues, records };
}
