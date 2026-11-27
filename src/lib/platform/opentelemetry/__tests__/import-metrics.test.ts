import { beforeEach, describe, expect, it, vi } from 'vitest';

const { instruments, register, mockLoggerError } = vi.hoisted(() => {
  const instruments = new Map<
    string,
    {
      options: unknown;
      add: ReturnType<typeof vi.fn>;
      record: ReturnType<typeof vi.fn>;
    }
  >();
  const register = (name: string, options: unknown) => {
    const instrument = { options, add: vi.fn(), record: vi.fn() };
    instruments.set(name, instrument);
    return instrument;
  };
  return { instruments, register, mockLoggerError: vi.fn() };
});

vi.mock('@opentelemetry/api', () => ({
  metrics: {
    getMeter: () => ({ createCounter: register, createHistogram: register }),
  },
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ error: mockLoggerError }),
}));

import {
  IMPORT_METRIC_TYPE,
  importMetrics,
  runResultOf,
} from '@/lib/platform/opentelemetry/import-metrics';

const run = () => instruments.get('ekartoteka.import.run');
const duration = () => instruments.get('ekartoteka.import.duration');
const records = () => instruments.get('ekartoteka.import.records');
const findings = () => instruments.get('ekartoteka.import.findings');

describe('import metrics instruments', () => {
  it('registers the run, duration, records and findings instruments', () => {
    expect([...instruments.keys()]).toEqual([
      'ekartoteka.import.run',
      'ekartoteka.import.duration',
      'ekartoteka.import.records',
      'ekartoteka.import.findings',
    ]);
  });

  it('measures the duration in seconds with bounds from 0.1 s to 300 s', () => {
    const bounds = (
      duration()?.options as {
        advice: { explicitBucketBoundaries: number[] };
      }
    ).advice.explicitBucketBoundaries;

    expect(duration()?.options).toMatchObject({ unit: 's' });
    expect(bounds[0]).toBe(0.1);
    expect(bounds.at(-1)).toBe(300);
    expect(bounds).toEqual([...bounds].sort((a, b) => a - b));
  });
});

describe('importMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts a run and records its duration in seconds', () => {
    importMetrics.recordRun(IMPORT_METRIC_TYPE.DATA, 'partial', 2500);

    expect(run()?.add).toHaveBeenCalledWith(1, {
      type: 'data',
      result: 'partial',
    });
    expect(duration()?.record).toHaveBeenCalledWith(2.5, {
      type: 'data',
      result: 'partial',
    });
  });

  it('adds the records of a run only when there are some', () => {
    importMetrics.recordRecords(IMPORT_METRIC_TYPE.SETTLEMENT, {
      entity: 'utility_settlement',
      action: 'unchanged',
      count: 0,
    });
    importMetrics.recordRecords(IMPORT_METRIC_TYPE.SETTLEMENT, {
      entity: 'utility_settlement',
      action: 'created',
      count: 3,
    });

    expect(records()?.add).toHaveBeenCalledTimes(1);
    expect(records()?.add).toHaveBeenCalledWith(3, {
      type: 'settlement',
      entity: 'utility_settlement',
      action: 'created',
    });
  });

  it('counts each finding once by severity and kind', () => {
    importMetrics.recordFinding(IMPORT_METRIC_TYPE.SETTLEMENT_PREVIEW, {
      severity: 'warning',
      kind: 'rounding',
    });

    expect(findings()?.add).toHaveBeenCalledWith(1, {
      type: 'settlement_preview',
      severity: 'warning',
      kind: 'rounding',
    });
  });
});

describe('runResultOf', () => {
  it.each([
    [{ complete: true, anySucceeded: true }, 'success'],
    [{ complete: true, anySucceeded: false }, 'success'],
    [{ complete: false, anySucceeded: true }, 'partial'],
    [{ complete: false, anySucceeded: false }, 'failure'],
  ] as const)('maps %o to %s', (input, expected) => {
    expect(runResultOf(input)).toBe(expected);
  });
});
