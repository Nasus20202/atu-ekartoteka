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
  type ImportRunSummary,
  measureImportRun,
} from '@/lib/platform/opentelemetry/import-metrics';

const run = () => instruments.get('ekartoteka.import.run');
const duration = () => instruments.get('ekartoteka.import.duration');
const records = () => instruments.get('ekartoteka.import.records');
const findings = () => instruments.get('ekartoteka.import.findings');

const summary: ImportRunSummary = {
  result: 'partial',
  records: [
    { entity: 'apartment', action: 'created', count: 2 },
    { entity: 'charge', action: 'updated', count: 0 },
  ],
  findings: [
    { severity: 'error', kind: 'database' },
    { severity: 'warning', kind: 'line-total' },
  ],
};

describe('measureImportRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the value of the run and records its summary', async () => {
    const summarise = vi.fn(() => summary);

    const value = await measureImportRun(
      IMPORT_METRIC_TYPE.DATA,
      async () => ({ hoas: 1 }),
      summarise
    );

    expect(value).toEqual({ hoas: 1 });
    expect(summarise).toHaveBeenCalledWith({ hoas: 1 });
    expect(run()?.add).toHaveBeenCalledWith(1, {
      type: 'data',
      result: 'partial',
    });
    expect(duration()?.record).toHaveBeenCalledWith(expect.any(Number), {
      type: 'data',
      result: 'partial',
    });
    expect(records()?.add).toHaveBeenCalledTimes(1);
    expect(findings()?.add).toHaveBeenCalledTimes(2);
  });

  it('records a failed run as a failure and rethrows the error unchanged', async () => {
    const error = new Error('database unavailable');
    const summarise = vi.fn(() => summary);

    await expect(
      measureImportRun(
        IMPORT_METRIC_TYPE.SETTLEMENT,
        async () => {
          throw error;
        },
        summarise
      )
    ).rejects.toBe(error);

    expect(summarise).not.toHaveBeenCalled();
    expect(run()?.add).toHaveBeenCalledWith(1, {
      type: 'settlement',
      result: 'failure',
    });
    expect(records()?.add).not.toHaveBeenCalled();
    expect(findings()?.add).not.toHaveBeenCalled();
  });

  it('returns the value and logs when the summary cannot be recorded', async () => {
    const summarise = vi.fn(() => {
      throw new Error('bad summary');
    });

    const value = await measureImportRun(
      IMPORT_METRIC_TYPE.DATABASE_VALIDATION,
      async () => 'checked',
      summarise
    );

    expect(value).toBe('checked');
    expect(mockLoggerError).toHaveBeenCalledWith(
      { error: expect.any(Error) },
      'Recording import metrics failed'
    );
  });

  it('returns the value when a metric instrument throws', async () => {
    run()?.add.mockImplementationOnce(() => {
      throw new Error('exporter down');
    });

    const value = await measureImportRun(
      IMPORT_METRIC_TYPE.SETTLEMENT_PREVIEW,
      async () => 42,
      () => summary
    );

    expect(value).toBe(42);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});
