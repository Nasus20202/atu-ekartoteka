import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockTransaction, mockParseApartmentBuffer, mockGetUniqueApartments } =
  vi.hoisted(() => ({
    mockTransaction: vi.fn(),
    mockParseApartmentBuffer: vi.fn(),
    mockGetUniqueApartments: vi.fn(),
  }));

vi.mock('@/lib/platform/database/prisma', () => ({
  prisma: { $transaction: mockTransaction },
}));
vi.mock('@/lib/import/parsers/apartment-parser', () => ({
  parseApartmentBuffer: mockParseApartmentBuffer,
  getUniqueApartments: mockGetUniqueApartments,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}));

import { processBatchImport } from '@/lib/import/use-cases/process-batch-import';
import { importMetrics } from '@/lib/platform/opentelemetry/import-metrics';

const APARTMENT = {
  externalOwnerId: 'W001',
  externalApartmentId: 'APT001',
  owner: 'Test Owner',
  email: '',
  address: 'Test St',
  building: '1',
  number: '1',
  postalCode: '00-000',
  city: 'City',
  shareNumerator: 1,
  shareDenominator: 100,
  isOwner: true,
  validFrom: null,
  validTo: null,
};

function createMockFile(content: string, name: string): File {
  const file = new File([content], name, { type: 'text/plain' });
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new TextEncoder().encode(content).buffer),
  });
  return file;
}

function transactionWithApartment() {
  mockTransaction.mockImplementation(async (fn: unknown) =>
    (fn as (tx: unknown) => Promise<void>)({
      homeownersAssociation: {
        upsert: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
      },
      apartment: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    })
  );
}

describe('processBatchImport metrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockParseApartmentBuffer.mockResolvedValue([APARTMENT]);
    mockGetUniqueApartments.mockReturnValue([APARTMENT]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('counts a stored batch as a success with the apartments it created', async () => {
    transactionWithApartment();
    const recordRun = vi.spyOn(importMetrics, 'recordRun');
    const recordRecords = vi.spyOn(importMetrics, 'recordRecords');

    const result = await processBatchImport([
      createMockFile('lok', 'hoa1/lok.txt'),
    ]);

    expect(result.success).toBe(true);
    expect(recordRun).toHaveBeenCalledWith(
      'data',
      'success',
      expect.any(Number)
    );
    expect(recordRecords).toHaveBeenCalledWith('data', {
      entity: 'apartment',
      action: 'created',
      count: 1,
    });
  });

  it('counts an HOA whose transaction failed once and records no records', async () => {
    mockTransaction.mockRejectedValue(new Error('Database error'));
    const recordRun = vi.spyOn(importMetrics, 'recordRun');
    const recordRecords = vi.spyOn(importMetrics, 'recordRecords');
    const recordFinding = vi.spyOn(importMetrics, 'recordFinding');

    await processBatchImport([
      createMockFile('charges', 'hoa1/nal_czynsz.txt'),
    ]);

    expect(recordRun).toHaveBeenCalledWith(
      'data',
      'failure',
      expect.any(Number)
    );
    expect(recordRecords).not.toHaveBeenCalled();
    expect(recordFinding).toHaveBeenCalledTimes(1);
    expect(recordFinding).toHaveBeenCalledWith('data', {
      severity: 'error',
      kind: 'transaction',
    });
  });

  it('counts file grouping errors along with the HOA errors, without repeats', async () => {
    mockTransaction.mockRejectedValue(new Error('Database error'));
    const recordFinding = vi.spyOn(importMetrics, 'recordFinding');

    await processBatchImport([
      createMockFile('unknown', 'hoa1/unknown.txt'),
      createMockFile('charges', 'hoa1/nal_czynsz.txt'),
    ]);

    expect(recordFinding.mock.calls).toEqual([
      ['data', { severity: 'error', kind: 'file-error' }],
      ['data', { severity: 'error', kind: 'transaction' }],
    ]);
  });

  it('counts a batch that cannot be read as a failure and rethrows the error', async () => {
    const recordRun = vi.spyOn(importMetrics, 'recordRun');

    await expect(processBatchImport(null as unknown as File[])).rejects.toThrow(
      TypeError
    );
    expect(recordRun).toHaveBeenCalledWith(
      'data',
      'failure',
      expect.any(Number)
    );
  });
});
