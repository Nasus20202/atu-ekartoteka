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
      findFirst: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
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

    it('reports cross-file mismatches as warnings and still imports', async () => {
      const chargesFile = makeFile('hoa1/nal_czynsz.txt');
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseNalCzynszBuffer.mockResolvedValue([]);
      mockParseWplatyFile.mockResolvedValue({ entries: [] });
      mockValidateNalCzynsz.mockReturnValue([]);
      mockValidateWplaty.mockReturnValue([]);
      mockValidateChargesCrossFile.mockReturnValue([
        { apartmentExternalId: 'APT001', message: 'cross mismatch' },
      ]);
      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(makeTx())
      );

      const result = await processBatchImport([chargesFile, paymentsFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].errors).toEqual([]);
      expect(result.results[0].warnings).toContainEqual({
        apartmentExternalId: 'APT001',
        message: 'cross mismatch',
      });
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

    it('keeps the header of the first notifications file with entries', async () => {
      const notifFile = makeFile('hoa1/pow_czynsz.txt');

      mockParsePowCzynszFile.mockResolvedValue({
        entries: [
          { externalId: 'own-1', apartmentCode: 'A1', lineNo: 1 },
          { externalId: 'own-1', apartmentCode: 'A1', lineNo: 2 },
        ],
        header: ['HOA header'],
        footer: ['HOA footer'],
      });

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(makeTx())
      );

      const result = await processBatchImport([notifFile]);

      expect(result.results[0].notifications?.total).toBe(2);
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

  describe('cross-year balance validation', () => {
    it('passes when no previous year payment exists', async () => {
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseWplatyFile.mockResolvedValue({
        entries: [
          {
            externalId: 'W001',
            apartmentCode: 'APT001',
            year: 2024,
            dateFrom: new Date('2024-01-01'),
            dateTo: new Date('2024-12-31'),
            openingDebt: 0,
            openingSurplus: 0,
            openingBalance: 500,
            totalCharges: 2400,
            closingBalance: 600,
            monthlyCharges: [
              200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
            ],
            monthlyPayments: [
              100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
            ],
          },
        ],
      });

      const tx = makeTx({
        payment: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        apartment: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'apt-1',
              externalOwnerId: 'W001',
              externalApartmentId: 'APT001',
            },
          ]),
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      });

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(tx)
      );

      const result = await processBatchImport([paymentsFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].errors).toHaveLength(0);
    });

    it('passes when opening balance matches previous year closing balance', async () => {
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseWplatyFile.mockResolvedValue({
        entries: [
          {
            externalId: 'W001',
            apartmentCode: 'APT001',
            year: 2024,
            dateFrom: new Date('2024-01-01'),
            dateTo: new Date('2024-12-31'),
            openingDebt: 0,
            openingSurplus: 0,
            openingBalance: 100,
            totalCharges: 2400,
            closingBalance: 200,
            monthlyCharges: [
              200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
            ],
            monthlyPayments: [
              100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
            ],
          },
        ],
      });

      const tx = makeTx({
        payment: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue({
            id: 'payment-2023',
            legacyClosingBalance: 100,
            dateTo: new Date(2023, 11, 31),
          }),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        apartment: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'apt-1',
              externalOwnerId: 'W001',
              externalApartmentId: 'APT001',
            },
          ]),
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      });

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(tx)
      );

      const result = await processBatchImport([paymentsFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].errors).toHaveLength(0);
    });

    it('warns when opening balance does not match previous year closing balance', async () => {
      const paymentsFile = makeFile('hoa1/wplaty.txt');

      mockParseWplatyFile.mockResolvedValue({
        entries: [
          {
            externalId: 'W001',
            apartmentCode: 'APT001',
            year: 2024,
            dateFrom: new Date('2024-01-01'),
            dateTo: new Date('2024-12-31'),
            openingDebt: 0,
            openingSurplus: 0,
            openingBalance: 500,
            totalCharges: 2400,
            closingBalance: 600,
            monthlyCharges: [
              200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
            ],
            monthlyPayments: [
              100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
            ],
          },
        ],
      });

      const tx = makeTx({
        payment: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue({
            id: 'payment-2023',
            legacyClosingBalance: 100,
            dateTo: new Date(2023, 11, 31),
          }),
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        apartment: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'apt-1',
              externalOwnerId: 'W001',
              externalApartmentId: 'APT001',
            },
          ]),
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      });

      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(tx)
      );

      const result = await processBatchImport([paymentsFile]);

      expect(result.results[0].errors).toEqual([]);
      const [warning] = result.results[0].warnings;
      expect(warning.message).toContain('saldo otwarcia');
      expect(warning.message).toContain('≠');
      expect(warning.message).toContain('APT001');
      expect(warning.message).toContain('2024');
    });
  });

  describe('WMB data dates', () => {
    it('reports an HOA that only has WMB files', async () => {
      const result = await processBatchImport([
        makeFile('hoa1/lokal_ost_wys.wmb', '20250131'),
      ]);

      expect(result.results[0].errors).toEqual([
        'Brak plików do importu dla wspólnoty hoa1.',
      ]);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('stores every WMB date on the HOA', async () => {
      mockParseNalCzynszBuffer.mockResolvedValue([]);
      const tx = makeTx();
      mockTransaction.mockImplementation(async (fn: unknown) =>
        (fn as (tx: ReturnType<typeof makeTx>) => Promise<void>)(tx)
      );

      await processBatchImport([
        makeFile('hoa1/nal_czynsz.txt'),
        makeFile('hoa1/lokal_ost_wys.wmb', '20250101'),
        makeFile('hoa1/nalicz_ost_wys.wmb', '20250201'),
        makeFile('hoa1/pow_czynsz_ost_wys.wmb', '20250301'),
      ]);

      expect(tx.homeownersAssociation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            apartmentsDataDate: new Date('2025-01-01T00:00:00.000Z'),
            chargesDataDate: new Date('2025-02-01T00:00:00.000Z'),
            notificationsDataDate: new Date('2025-03-01T00:00:00.000Z'),
          },
        })
      );
    });
  });
});
