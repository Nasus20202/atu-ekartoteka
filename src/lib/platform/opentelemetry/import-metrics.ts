/**
 * Import Metrics
 *
 * Tracks import runs: how they end, how long they take, the records they wrote
 * and the findings they reported.
 */

import { metrics } from '@opentelemetry/api';

import type { ImportErrorKind } from '@/lib/import/types/import-error';
import type { ImportWarningKind } from '@/lib/import/types/import-warning';
import { createLogger } from '@/lib/platform/logging/logger';
import type { SettlementIssueKind } from '@/lib/settlements/types/settlement-issue';

const IMPORT_METER_NAME = 'ekartoteka.import';
const MS_PER_SECOND = 1000;
// From a fraction of a second for one small file to minutes for a full batch
const DURATION_BUCKET_BOUNDARIES_S = [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300];

export const IMPORT_METRIC_TYPE = {
  DATA: 'data',
  DATABASE_VALIDATION: 'database_validation',
  SETTLEMENT_PREVIEW: 'settlement_preview',
  SETTLEMENT: 'settlement',
} as const;

export type ImportMetricType =
  (typeof IMPORT_METRIC_TYPE)[keyof typeof IMPORT_METRIC_TYPE];
export type ImportRunResult = 'success' | 'partial' | 'failure';
export type ImportEntity =
  | 'apartment'
  | 'charge'
  | 'notification'
  | 'payment'
  | 'utility_settlement'
  | 'annual_settlement';
export type ImportAction =
  'created' | 'updated' | 'skipped' | 'deleted' | 'unchanged';
export type FindingSeverity = 'error' | 'warning';
export type FindingKind =
  ImportErrorKind | ImportWarningKind | SettlementIssueKind;

export interface ImportRecordCount {
  entity: ImportEntity;
  action: ImportAction;
  count: number;
}

export interface ImportFinding {
  severity: FindingSeverity;
  kind: FindingKind;
}

export interface ImportRunSummary {
  result: ImportRunResult;
  records: ImportRecordCount[];
  findings: ImportFinding[];
}

const logger = createLogger('import:metrics');

const meter = metrics.getMeter(IMPORT_METER_NAME);

const runCounter = meter.createCounter('ekartoteka.import.run', {
  description: 'Number of import runs',
});

const durationHistogram = meter.createHistogram('ekartoteka.import.duration', {
  description: 'Duration of import runs',
  unit: 's',
  advice: { explicitBucketBoundaries: DURATION_BUCKET_BOUNDARIES_S },
});

const recordsCounter = meter.createCounter('ekartoteka.import.records', {
  description: 'Records written by imports',
});

const findingsCounter = meter.createCounter('ekartoteka.import.findings', {
  description: 'Errors and warnings reported by imports',
});

export const importMetrics = {
  recordRun(
    type: ImportMetricType,
    result: ImportRunResult,
    durationMs: number
  ) {
    const attributes = { type, result };
    runCounter.add(1, attributes);
    durationHistogram.record(durationMs / MS_PER_SECOND, attributes);
  },

  recordRecords(
    type: ImportMetricType,
    { entity, action, count }: ImportRecordCount
  ) {
    if (count > 0) {
      recordsCounter.add(count, { type, entity, action });
    }
  },

  recordFinding(type: ImportMetricType, { severity, kind }: ImportFinding) {
    findingsCounter.add(1, { type, severity, kind });
  },
};

/** Complete runs succeed; a run that stopped short is partial when part of it succeeded. */
export function runResultOf({
  complete,
  anySucceeded,
}: {
  complete: boolean;
  anySucceeded: boolean;
}): ImportRunResult {
  if (complete) return 'success';
  return anySucceeded ? 'partial' : 'failure';
}

function recordSafely(record: () => void): void {
  try {
    record();
  } catch (error) {
    logger.error({ error }, 'Recording import metrics failed');
  }
}

function elapsedMs(startedAt: number): number {
  return performance.now() - startedAt;
}

function recordCompletedRun(
  type: ImportMetricType,
  summary: ImportRunSummary,
  durationMs: number
): void {
  importMetrics.recordRun(type, summary.result, durationMs);
  for (const record of summary.records) {
    importMetrics.recordRecords(type, record);
  }
  for (const finding of summary.findings) {
    importMetrics.recordFinding(type, finding);
  }
}

/**
 * Runs an import and counts it. `summarise` describes a finished run and is
 * called only when the run succeeds. A failed run is recorded as a failure and
 * rethrown unchanged. Recording never changes the outcome: a metric that cannot
 * be recorded is logged and the import returns its value as usual.
 */
export async function measureImportRun<T>(
  type: ImportMetricType,
  run: () => Promise<T>,
  summarise: (value: T) => ImportRunSummary
): Promise<T> {
  const startedAt = performance.now();
  try {
    const value = await run();
    recordSafely(() =>
      recordCompletedRun(type, summarise(value), elapsedMs(startedAt))
    );
    return value;
  } catch (error) {
    recordSafely(() =>
      importMetrics.recordRun(type, 'failure', elapsedMs(startedAt))
    );
    throw error;
  }
}
