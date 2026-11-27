import type { ImportErrorKind } from '@/lib/import/types/import-error';
import type {
  BatchImportResult,
  EntityStats,
  HOAImportResult,
} from '@/lib/import/types/import-result';
import {
  type ImportAction,
  type ImportEntity,
  type ImportFinding,
  type ImportRecordCount,
  type ImportRunSummary,
  runResultOf,
} from '@/lib/platform/opentelemetry/import-metrics';

type StatsAction = Extract<keyof EntityStats, ImportAction>;

const STATS_ACTIONS: readonly StatsAction[] = [
  'created',
  'updated',
  'skipped',
  'deleted',
];

// Raised before anything is written, or by a transaction that was rolled back:
// the counts of such an HOA were never stored
const UNSTORED_ERROR_KINDS: readonly ImportErrorKind[] = [
  'missing-files',
  'duplicate-records',
  'balance-mismatch',
  'transaction',
];

function batchResult({ success, results }: BatchImportResult) {
  return runResultOf({
    complete: success,
    anySucceeded: results.some((hoa) => hoa.errors.length === 0),
  });
}

function recordsOf(hoa: HOAImportResult): ImportRecordCount[] {
  if (hoa.errors.some(({ kind }) => UNSTORED_ERROR_KINDS.includes(kind))) {
    return [];
  }
  const entities: [ImportEntity, EntityStats | undefined][] = [
    ['apartment', hoa.apartments],
    ['charge', hoa.charges],
    ['notification', hoa.notifications],
    ['payment', hoa.payments],
  ];
  return entities.flatMap(([entity, stats]) =>
    stats
      ? STATS_ACTIONS.map((action) => ({
          entity,
          action,
          count: stats[action],
        }))
      : []
  );
}

function findingsOf(hoa: HOAImportResult): ImportFinding[] {
  return [
    ...hoa.errors.map((error): ImportFinding => ({
      severity: 'error',
      kind: error.kind,
    })),
    ...hoa.warnings.map((warning): ImportFinding => ({
      severity: 'warning',
      kind: warning.kind,
    })),
  ];
}

/**
 * Batch errors that copy an HOA's error carry its hoaId, so they are counted
 * once through that HOA. The errors without one are file grouping errors.
 */
export function dataImportSummary(result: BatchImportResult): ImportRunSummary {
  const fileErrors = result.errors
    .filter((error) => error.hoaId === undefined)
    .map((error): ImportFinding => ({ severity: 'error', kind: error.kind }));
  return {
    result: batchResult(result),
    records: result.results.flatMap(recordsOf),
    findings: [...fileErrors, ...result.results.flatMap(findingsOf)],
  };
}

/** Validation writes nothing, so it reports findings only. */
export function databaseValidationSummary(
  result: BatchImportResult
): ImportRunSummary {
  return {
    result: batchResult(result),
    records: [],
    findings: result.results.flatMap(findingsOf),
  };
}
