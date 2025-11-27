import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/database/prisma';
import { processBatchImport } from '@/lib/import/import-handler';
import * as apartmentParser from '@/lib/parsers/apartment-parser';
import * as nalCzynszParser from '@/lib/parsers/nal-czynsz-parser';

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/parsers/apartment-parser', () => ({
  parseApartmentBuffer: vi.fn(),
  getUniqueApartments: vi.fn(),
}));

vi.mock('@/lib/parsers/nal-czynsz-parser', () => ({
  parseNalCzynszBuffer: vi.fn(),
}));

function createMockFile(content: string, name: string): File {
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], name, { type: 'text/plain' });
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new TextEncoder().encode(content).buffer),
  });
  return file;
}

describe('import-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processBatchImport', () => {
    it('should group files by HOA and process them', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      const mockApartments = [
        {
          externalId: 'W001',
          owner: 'Test Owner',
          email: 'test@test.com',
          address: 'Test St',
          building: '1',
          number: '1',
          postalCode: '00-000',
          city: 'City',
          shareNumerator: 1,
          shareDenominator: 100,
        },
      ];

      vi.mocked(apartmentParser.parseApartmentBuffer).mockResolvedValue(
        mockApartments as ReturnType<
          typeof apartmentParser.parseApartmentBuffer
        > extends Promise<infer T>
          ? T
          : never
      );
      vi.mocked(apartmentParser.getUniqueApartments).mockReturnValue(
        mockApartments as ReturnType<typeof apartmentParser.getUniqueApartments>
      );
      vi.mocked(nalCzynszParser.parseNalCzynszBuffer).mockResolvedValue([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
          },
          apartment: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          charge: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return (fn as (tx: typeof mockTx) => Promise<void>)(mockTx);
      });

      const result = await processBatchImport([lokFile, chargesFile]);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].hoaId).toBe('hoa1');
      expect(result.results[0].apartments.created).toBe(1);
    });

    it('should require lok.txt file', async () => {
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Brak pliku lok.txt');
    });

    it('should reject invalid file structure', async () => {
      const invalidFile = createMockFile('data', 'lok.txt');

      const result = await processBatchImport([invalidFile]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Nieprawidłowa struktura');
    });

    it('should reject unknown file names', async () => {
      const invalidFile = createMockFile('data', 'hoa1/invalid.txt');

      const result = await processBatchImport([invalidFile]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Nieznany plik');
    });

    it('should handle transaction errors gracefully', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');

      vi.mocked(apartmentParser.parseApartmentBuffer).mockResolvedValue([]);
      vi.mocked(apartmentParser.getUniqueApartments).mockReturnValue([]);
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error('Database error')
      );

      const result = await processBatchImport([lokFile]);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].errors).toContain(
        'Błąd transakcji: Database error'
      );
    });

    it('should process charges only if file is provided', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');

      vi.mocked(apartmentParser.parseApartmentBuffer).mockResolvedValue([]);
      vi.mocked(apartmentParser.getUniqueApartments).mockReturnValue([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
          },
          apartment: {
            findUnique: vi.fn().mockResolvedValue(null),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([]),
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([lokFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].charges).toBeUndefined();
      expect(nalCzynszParser.parseNalCzynszBuffer).not.toHaveBeenCalled();
    });

    it('should ignore .wmb files without error', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');
      const wmbFile = createMockFile('wmb data', 'hoa1/lokal_ost_wys.wmb');

      vi.mocked(apartmentParser.parseApartmentBuffer).mockResolvedValue([]);
      vi.mocked(apartmentParser.getUniqueApartments).mockReturnValue([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
          },
          apartment: {
            findUnique: vi.fn().mockResolvedValue(null),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([]),
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([lokFile, wmbFile]);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
