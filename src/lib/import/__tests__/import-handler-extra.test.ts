import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processBatchImport } from '@/lib/import/import-handler';

// Shared hoisted mocks
const {
  mockTransaction,
  mockParseApartmentBuffer,
  mockGetUniqueApartments,
  mockParseNalCzynszBuffer,
  mockParsePowCzynszFile,
  mockParseWplatyFile,
  mockValidateNalCzynsz,
  mockValidateWplaty,
  mockValidateChargesCrossFile,
} = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockParseApartmentBuffer: vi.fn(),
  mockGetUniqueApartments: vi.fn(),
  mockParseNalCzynszBuffer: vi.fn(),
  mockParsePowCzynszFile: vi.fn(),
  mockParseWplatyFile: vi.fn(),
  mockValidateNalCzynsz: vi.fn().mockReturnValue([]),
  mockValidateWplaty: vi.fn().mockReturnValue([]),
  mockValidateChargesCrossFile: vi.fn().mockReturnValue([]),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { $transaction: mockTransaction },
}));

vi.mock('@/lib/parsers/apartment-parser', () => ({
  parseApartmentBuffer: mockParseApartmentBuffer,
  getUniqueApartments: mockGetUniqueApartments,
}));

vi.mock('@/lib/parsers/nal-czynsz-parser', () => ({
  parseNalCzynszBuffer: mockParseNalCzynszBuffer,
}));

vi.mock('@/lib/parsers/pow-czynsz-parser', () => ({
  parsePowCzynszFile: mockParsePowCzynszFile,
}));

vi.mock('@/lib/parsers/wplaty-parser', () => ({
  parseWplatyFile: mockParseWplatyFile,
}));

vi.mock('@/lib/import/validators', () => ({
  validateNalCzynsz: mockValidateNalCzynsz,
  validateWplaty: mockValidateWplaty,
  validateChargesCrossFile: mockValidateChargesCrossFile,
}));

function makeFile(name: string, content = 'data'): File {
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], name, { type: 'text/plain' });
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new TextEncoder().encode(content).buffer),
  });
  return file;
}

function makeTx(overrides: Record<string, unknown> = {}) {
  return {
    homeownersAssociation: {
      upsert: vi.fn().mockResolvedValue({ id: 'hoa-id', externalId: 'hoa1' }),
      update: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
    },
    apartment: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    charge: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    chargeNotification: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    payment: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    ...overrides,
  };
}

describe('import-handler additional coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateNalCzynsz.mockReturnValue([]);
    mockValidateWplaty.mockReturnValue([]);
    mockValidateChargesCrossFile.mockReturnValue([]);
  });

  describe('skipValidation option', () => {
    it('skips nal_czynsz validation when skipValidation is true', async () => {
      const lokFile = makeFile('hoa1/lok.txt');
      const chargesFile = makeFile('hoa1/nal_czynsz.txt');

      mockParseApartmentBuffer.mockResolvedValue([]);
      mockGetUniqueApartments.mockReturnValue([]);
      mockParseNalCzynszBuffer.mockResolvedValue([]);
      mockValidateNalCzynsz.mockReturnValue(['validation error']);

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(makeTx())
      );

      const result = await processBatchImport([lokFile, chargesFile], {
        skipValidation: true,
      });

      expect(result.success).toBe(true);
      expect(mockValidateNalCzynsz).not.toHaveBeenCalled();
    });

    it('skips wplaty validation when skipValidation is true', async () => {
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseWplatyFile.mockResolvedValue({ entries: [] });
      mockValidateWplaty.mockReturnValue(['balance error']);

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(makeTx())
      );

      const result = await processBatchImport([paymentsFile], {
        skipValidation: true,
      });

      expect(result.success).toBe(true);
      expect(mockValidateWplaty).not.toHaveBeenCalled();
    });

    it('skips cross-file validation when skipValidation is true', async () => {
      const chargesFile = makeFile('hoa1/nal_czynsz.txt');
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseNalCzynszBuffer.mockResolvedValue([]);
      mockParseWplatyFile.mockResolvedValue({ entries: [] });
      mockValidateChargesCrossFile.mockReturnValue(['cross error']);

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(makeTx())
      );

      const result = await processBatchImport([chargesFile, paymentsFile], {
        skipValidation: true,
      });

      expect(result.success).toBe(true);
      expect(mockValidateChargesCrossFile).not.toHaveBeenCalled();
    });

    it('runs validators when skipValidation is false (default)', async () => {
      const chargesFile = makeFile('hoa1/nal_czynsz.txt');
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseNalCzynszBuffer.mockResolvedValue([{ totalAmount: 100 }]);
      mockParseWplatyFile.mockResolvedValue({ entries: [{}] });
      mockValidateNalCzynsz.mockReturnValue([]);
      mockValidateWplaty.mockReturnValue([]);
      mockValidateChargesCrossFile.mockReturnValue([]);

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(makeTx())
      );

      await processBatchImport([chargesFile, paymentsFile]);

      expect(mockValidateNalCzynsz).toHaveBeenCalled();
      expect(mockValidateWplaty).toHaveBeenCalled();
      expect(mockValidateChargesCrossFile).toHaveBeenCalled();
    });

    it('returns warnings when nal_czynsz validation fails without skipValidation', async () => {
      const chargesFile = makeFile('hoa1/nal_czynsz.txt');

      mockParseNalCzynszBuffer.mockResolvedValue([]);
      mockValidateNalCzynsz.mockReturnValue([
        {
          apartmentExternalId: 'APT001',
          period: '202401',
          lineNo: 1,
          difference: '0.0200',
          message: 'warning: mismatch',
        },
      ]);

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].errors).toHaveLength(0);
      expect(result.results[0].warnings).toEqual([
        expect.objectContaining({
          apartmentExternalId: 'APT001',
          period: '202401',
          lineNo: 1,
          difference: '0.0200',
          message: 'warning: mismatch',
        }),
      ]);
    });

    it('returns errors when wplaty validation fails without skipValidation', async () => {
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseWplatyFile.mockResolvedValue({ entries: [{}] });
      mockValidateWplaty.mockReturnValue(['balance mismatch']);

      const result = await processBatchImport([paymentsFile]);

      expect(result.success).toBe(false);
      expect(result.results[0].errors).toContain('balance mismatch');
    });

    it('returns errors when cross-file validation fails without skipValidation', async () => {
      const chargesFile = makeFile('hoa1/nal_czynsz.txt');
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseNalCzynszBuffer.mockResolvedValue([]);
      mockParseWplatyFile.mockResolvedValue({ entries: [{}] });
      mockValidateNalCzynsz.mockReturnValue([]);
      mockValidateWplaty.mockReturnValue([]);
      mockValidateChargesCrossFile.mockReturnValue(['cross mismatch']);

      const result = await processBatchImport([chargesFile, paymentsFile]);

      expect(result.success).toBe(false);
      expect(result.results[0].errors).toContain('cross mismatch');
    });
  });

  describe('notifications and payments import paths', () => {
    it('processes pow_czynsz.txt notifications file', async () => {
      const notifFile = makeFile('hoa1/pow_czynsz.txt');

      mockParsePowCzynszFile.mockResolvedValue({
        entries: [],
        header: [],
        footer: [],
      });

      const tx = makeTx();
      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(tx)
      );

      const result = await processBatchImport([notifFile]);

      expect(result.results[0].notifications).toBeDefined();
      expect(result.results[0].notifications?.total).toBe(0);
      expect(result.results[0].errors).toHaveLength(0);
    });

    it('processes wplaty.txt payments file', async () => {
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseWplatyFile.mockResolvedValue({ entries: [] });

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(makeTx())
      );

      const result = await processBatchImport([paymentsFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].payments).toBeDefined();
      expect(result.results[0].payments?.total).toBe(0);
    });
  });

  describe('unexpected error handling in processBatchImport', () => {
    it('catches errors from parseApartmentBuffer and returns them as transaction errors', async () => {
      const lokFile = makeFile('hoa1/lok.txt');

      // parseApartmentBuffer is called inside importSingleHOA's try block
      // so it's caught by the inner catch → "Błąd transakcji"
      mockParseApartmentBuffer.mockRejectedValue(
        new Error('Unexpected parse error')
      );
      mockGetUniqueApartments.mockReturnValue([]);

      const result = await processBatchImport([lokFile]);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].errors[0]).toContain('Błąd transakcji');
      expect(result.results[0].errors[0]).toContain('Unexpected parse error');
    });

    it('returns non-Error thrown values as "Nieznany błąd" in transaction error', async () => {
      const lokFile = makeFile('hoa1/lok.txt');

      mockParseApartmentBuffer.mockRejectedValue('string error');
      mockGetUniqueApartments.mockReturnValue([]);

      const result = await processBatchImport([lokFile]);

      expect(result.success).toBe(false);
      expect(result.results[0].errors[0]).toContain('Nieznany błąd');
    });
  });
});
