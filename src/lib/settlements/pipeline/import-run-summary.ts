import {
  type ImportEntity,
  type ImportFinding,
  type ImportRunSummary,
  runResultOf,
} from '@/lib/platform/opentelemetry/import-metrics';
import type {
  SettlementImportResponse,
  SettlementImportStats,
  SettlementPreviewResponse,
} from '@/lib/settlements/dto/settlement-import-dto';
import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';

/** A file whose records were stored, with the counts of what was stored. */
export interface SettlementWrite {
  documentType: SettlementDocumentType;
  stats: SettlementImportStats;
}

export interface SettlementImportRun {
  response: SettlementImportResponse;
  writes: SettlementWrite[];
  /** Stored settlements a clean import removed, of each kind */
  removed?: Record<SettlementDocumentType, number>;
}

const ENTITY_BY_DOCUMENT: Record<SettlementDocumentType, ImportEntity> = {
  utility: 'utility_settlement',
  annual: 'annual_settlement',
};

const WRITE_ACTIONS: readonly (keyof SettlementImportStats)[] = [
  'created',
  'updated',
  'unchanged',
];

const hasNoErrors = ({ errors }: { errors: SettlementIssue[] }) =>
  errors.length === 0;

function issueFindings({
  errors,
  warnings,
}: {
  errors: SettlementIssue[];
  warnings: SettlementIssue[];
}): ImportFinding[] {
  return [
    ...errors.map((issue): ImportFinding => ({
      severity: 'error',
      kind: issue.kind,
    })),
    ...warnings.map((issue): ImportFinding => ({
      severity: 'warning',
      kind: issue.kind,
    })),
  ];
}

export function settlementPreviewSummary({
  files,
}: SettlementPreviewResponse): ImportRunSummary {
  return {
    result: runResultOf({
      complete: files.every(hasNoErrors),
      anySucceeded: files.some(hasNoErrors),
    }),
    records: [],
    findings: files.flatMap(issueFindings),
  };
}

export function settlementImportSummary({
  response,
  writes,
  removed,
}: SettlementImportRun): ImportRunSummary {
  return {
    result: runResultOf({
      complete: response.success,
      anySucceeded: response.files.some((file) => file.imported),
    }),
    records: [
      ...writes.flatMap(({ documentType, stats }) =>
        WRITE_ACTIONS.map((action) => ({
          entity: ENTITY_BY_DOCUMENT[documentType],
          action,
          count: stats[action],
        }))
      ),
      ...Object.entries(removed ?? {}).map(([type, count]) => ({
        entity: ENTITY_BY_DOCUMENT[type as SettlementDocumentType],
        action: 'deleted' as const,
        count,
      })),
    ],
    findings: response.files.flatMap(issueFindings),
  };
}
