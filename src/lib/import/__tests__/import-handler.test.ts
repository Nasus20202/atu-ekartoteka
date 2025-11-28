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
          externalOwnerId: 'W001',
          externalApartmentId: 'APT001',
          owner: 'Test Owner',
          email: 'test@test.com',
          address: 'Test St',
          building: '1',
          number: '1',
          postalCode: '00-000',
          city: 'City',
          shareNumerator: 1,
          shareDenominator: 100,
          isOwner: true,
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

    it('should process charges without lok.txt file', async () => {
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      vi.mocked(nalCzynszParser.parseNalCzynszBuffer).mockResolvedValue([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi
              .fn()
              .mockResolvedValue({ id: 'hoa-id', externalId: 'hoa1' }),
          },
          apartment: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          charge: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return (fn as (tx: typeof mockTx) => Promise<void>)(mockTx);
      });

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].hoaId).toBe('hoa1');
      expect(result.results[0].apartments.total).toBe(0);
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

    it('should delete existing data when cleanImport is true', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');

      const mockApartments = [
        {
          externalOwnerId: 'W001',
          externalApartmentId: 'APT001',
          owner: 'Test Owner',
          email: 'test@test.com',
          address: 'Test St',
          building: '1',
          number: '1',
          postalCode: '00-000',
          city: 'City',
          shareNumerator: 1,
          shareDenominator: 100,
          isOwner: true,
        },
      ];

      vi.mocked(apartmentParser.parseApartmentBuffer).mockResolvedValue(
        mockApartments as any
      );
      vi.mocked(apartmentParser.getUniqueApartments).mockReturnValue(
        mockApartments as any
      );

      const deleteChargeMock = vi.fn().mockResolvedValue({ count: 5 });
      const deleteNotificationMock = vi.fn().mockResolvedValue({ count: 3 });
      const deletePaymentMock = vi.fn().mockResolvedValue({ count: 2 });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
          },
          apartment: {
            findMany: vi
              .fn()
              .mockResolvedValue([{ id: 'apt-1' }, { id: 'apt-2' }]),
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          charge: {
            deleteMany: deleteChargeMock,
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          chargeNotification: {
            deleteMany: deleteNotificationMock,
          },
          payment: {
            deleteMany: deletePaymentMock,
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([lokFile], { cleanImport: true });

      expect(result.success).toBe(true);
      expect(deleteChargeMock).toHaveBeenCalledWith({
        where: { apartmentId: { in: ['apt-1', 'apt-2'] } },
      });
      expect(deleteNotificationMock).toHaveBeenCalledWith({
        where: { apartmentId: { in: ['apt-1', 'apt-2'] } },
      });
      expect(deletePaymentMock).toHaveBeenCalledWith({
        where: { apartmentId: { in: ['apt-1', 'apt-2'] } },
      });
    });

    it('should not delete data when cleanImport is false', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');

      vi.mocked(apartmentParser.parseApartmentBuffer).mockResolvedValue([]);
      vi.mocked(apartmentParser.getUniqueApartments).mockReturnValue([]);

      const deleteChargeMock = vi.fn();
      const deleteNotificationMock = vi.fn();
      const deletePaymentMock = vi.fn();

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
          },
          apartment: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          charge: {
            deleteMany: deleteChargeMock,
          },
          chargeNotification: {
            deleteMany: deleteNotificationMock,
          },
          payment: {
            deleteMany: deletePaymentMock,
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([lokFile], {
        cleanImport: false,
      });

      expect(result.success).toBe(true);
      expect(deleteChargeMock).not.toHaveBeenCalled();
      expect(deleteNotificationMock).not.toHaveBeenCalled();
      expect(deletePaymentMock).not.toHaveBeenCalled();
    });

    it('should use existing apartments from DB when lok.txt is not provided', async () => {
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      vi.mocked(nalCzynszParser.parseNalCzynszBuffer).mockResolvedValue([
        {
          id: 'W001',
          apartmentExternalId: 'APT001',
          dateFrom: new Date(),
          dateTo: new Date(),
          period: '2024-01',
          lineNo: 1,
          description: 'Test charge',
          quantity: 1,
          unit: 'szt',
          unitPrice: 100,
          totalAmount: 100,
        },
      ]);

      const apartmentFindManyMock = vi.fn().mockResolvedValue([
        {
          id: 'existing-apt-id',
          externalOwnerId: 'W001',
          externalApartmentId: 'APT001',
          isActive: true,
        },
      ]);
      const chargeCreateManyMock = vi.fn().mockResolvedValue({ count: 1 });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi
              .fn()
              .mockResolvedValue({ id: 'hoa-id', externalId: 'hoa1' }),
          },
          apartment: {
            findMany: apartmentFindManyMock,
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          charge: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: chargeCreateManyMock,
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].apartments.total).toBe(0); // No lok.txt
      expect(result.results[0].charges?.created).toBe(1); // Charge was created
      expect(chargeCreateManyMock).toHaveBeenCalled();
    });

    it('should not deactivate apartments when lok.txt is not provided', async () => {
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      vi.mocked(nalCzynszParser.parseNalCzynszBuffer).mockResolvedValue([]);

      const apartmentUpdateManyMock = vi.fn().mockResolvedValue({ count: 0 });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi
              .fn()
              .mockResolvedValue({ id: 'hoa-id', externalId: 'hoa1' }),
          },
          apartment: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'apt-1',
                externalOwnerId: 'W001',
                externalApartmentId: 'APT001',
                isActive: true,
              },
            ]),
            updateMany: apartmentUpdateManyMock,
          },
          charge: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(true);
      // updateMany should not be called for deactivation when no lok.txt
      expect(apartmentUpdateManyMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } })
      );
    });

    it('should map charges using combined externalOwnerId#externalApartmentId key', async () => {
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      // Charge entry with id (externalOwnerId) and apartmentExternalId (externalApartmentId)
      vi.mocked(nalCzynszParser.parseNalCzynszBuffer).mockResolvedValue([
        {
          id: 'W001', // This is externalOwnerId in the charge file
          apartmentExternalId: 'APT001', // This is externalApartmentId
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
          period: '2024-01',
          lineNo: 1,
          description: 'Test charge',
          quantity: 1,
          unit: 'szt',
          unitPrice: 100,
          totalAmount: 100,
        },
        {
          id: 'W002', // Different owner
          apartmentExternalId: 'APT001', // Same apartment code but different owner
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
          period: '2024-01',
          lineNo: 1,
          description: 'Test charge 2',
          quantity: 1,
          unit: 'szt',
          unitPrice: 200,
          totalAmount: 200,
        },
      ]);

      const chargeCreateManyMock = vi.fn().mockResolvedValue({ count: 2 });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi
              .fn()
              .mockResolvedValue({ id: 'hoa-id', externalId: 'hoa1' }),
          },
          apartment: {
            findMany: vi.fn().mockResolvedValue([
              // Two apartments with same externalApartmentId but different externalOwnerId
              {
                id: 'apt-1',
                externalOwnerId: 'W001',
                externalApartmentId: 'APT001',
                isActive: true,
              },
              {
                id: 'apt-2',
                externalOwnerId: 'W002',
                externalApartmentId: 'APT001',
                isActive: true,
              },
            ]),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          charge: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: chargeCreateManyMock,
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].charges?.created).toBe(2);
      // Both charges should be created - mapped to different apartments
      expect(chargeCreateManyMock).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ apartmentId: 'apt-1' }),
          expect.objectContaining({ apartmentId: 'apt-2' }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should skip charges when apartment key does not match', async () => {
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      vi.mocked(nalCzynszParser.parseNalCzynszBuffer).mockResolvedValue([
        {
          id: 'W001',
          apartmentExternalId: 'APT001',
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
          period: '2024-01',
          lineNo: 1,
          description: 'Test charge',
          quantity: 1,
          unit: 'szt',
          unitPrice: 100,
          totalAmount: 100,
        },
        {
          id: 'W999', // Non-existent owner
          apartmentExternalId: 'APT001',
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
          period: '2024-01',
          lineNo: 2,
          description: 'Test charge - should be skipped',
          quantity: 1,
          unit: 'szt',
          unitPrice: 50,
          totalAmount: 50,
        },
      ]);

      const chargeCreateManyMock = vi.fn().mockResolvedValue({ count: 1 });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi
              .fn()
              .mockResolvedValue({ id: 'hoa-id', externalId: 'hoa1' }),
          },
          apartment: {
            findMany: vi.fn().mockResolvedValue([
              // Only W001#APT001 exists
              {
                id: 'apt-1',
                externalOwnerId: 'W001',
                externalApartmentId: 'APT001',
                isActive: true,
              },
            ]),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          charge: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: chargeCreateManyMock,
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].charges?.created).toBe(1);
      expect(result.results[0].charges?.skipped).toBe(1); // W999#APT001 not found
    });

    it('should correctly identify unique apartments by externalOwnerId+externalApartmentId', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');

      // Two entries with same externalApartmentId but different externalOwnerId
      const mockApartments = [
        {
          externalOwnerId: 'W001',
          externalApartmentId: 'APT001',
          owner: 'Owner 1',
          email: 'owner1@test.com',
          address: 'Test St',
          building: '1',
          number: '1',
          postalCode: '00-000',
          city: 'City',
          shareNumerator: 50,
          shareDenominator: 100,
          isOwner: true,
        },
        {
          externalOwnerId: 'W002',
          externalApartmentId: 'APT001', // Same apartment code
          owner: 'Owner 2',
          email: 'owner2@test.com',
          address: 'Test St',
          building: '1',
          number: '1',
          postalCode: '00-000',
          city: 'City',
          shareNumerator: 50,
          shareDenominator: 100,
          isOwner: true,
        },
      ];

      vi.mocked(apartmentParser.parseApartmentBuffer).mockResolvedValue(
        mockApartments as any
      );
      vi.mocked(apartmentParser.getUniqueApartments).mockReturnValue(
        mockApartments as any
      );

      const apartmentCreateManyMock = vi.fn().mockResolvedValue({ count: 2 });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const mockTx = {
          homeownersAssociation: {
            upsert: vi.fn().mockResolvedValue({ id: 'hoa-id' }),
          },
          apartment: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: apartmentCreateManyMock,
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return fn(mockTx as never);
      });

      const result = await processBatchImport([lokFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].apartments.created).toBe(2);
      // Both apartments should be created as they have different combined keys
      expect(apartmentCreateManyMock).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            externalOwnerId: 'W001',
            externalApartmentId: 'APT001',
          }),
          expect.objectContaining({
            externalOwnerId: 'W002',
            externalApartmentId: 'APT001',
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });
});
