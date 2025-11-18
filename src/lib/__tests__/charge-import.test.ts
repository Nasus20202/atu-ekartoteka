import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockHOA } from '@/__tests__/fixtures';
import { importChargesFromBuffer } from '@/lib/charge-import';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    homeownersAssociation: {
      findUnique: vi.fn(),
    },
    apartment: {
      findMany: vi.fn(),
    },
    charge: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const { prisma } = await import('@/lib/prisma');

describe('charge-import', () => {
  describe('importChargesFromBuffer', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create charges for existing apartments', async () => {
      const mockHOA = createMockHOA({ externalId: 'hoa1' });
      const mockApartment = {
        id: 'apt-1',
        externalId: 'hoa1-hoa1-00000-00001M',
        number: '1',
        owner: 'John Doe',
        address: null,
        building: null,
        postalCode: null,
        city: null,
        floors: null,
        locationType: null,
        area: null,
        height: null,
        isActive: true,
        homeownersAssociationId: mockHOA.id,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([mockApartment]);
      vi.mocked(prisma.charge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.charge.createMany).mockResolvedValue({ count: 2 });

      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Zarządzanie#1#szt#73#73,00\n' +
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#2#Eksploatacja#1#szt#245#245,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');

      const result = await importChargesFromBuffer(buffer, mockHOA.externalId);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.total).toBe(2);
      expect(result.errors).toHaveLength(0);

      expect(prisma.charge.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ description: 'Zarządzanie' }),
          expect.objectContaining({ description: 'Eksploatacja' }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should update existing charges', async () => {
      const mockHOA = createMockHOA({ externalId: 'hoa1' });
      const mockApartment = {
        id: 'apt-1',
        externalId: 'hoa1-hoa1-00000-00001M',
        number: '1',
        owner: 'John Doe',
        address: null,
        building: null,
        postalCode: null,
        city: null,
        floors: null,
        locationType: null,
        area: null,
        height: null,
        isActive: true,
        homeownersAssociationId: mockHOA.id,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingCharge = {
        id: 'charge-1',
        externalId: 'W00162',
        externalLineNo: 1,
        apartmentId: mockApartment.id,
        dateFrom: new Date(2025, 0, 1),
        dateTo: new Date(2025, 0, 31),
        period: '202501',
        description: 'Old Description',
        quantity: 1,
        unit: 'szt',
        unitPrice: 73,
        totalAmount: 73,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([mockApartment]);
      vi.mocked(prisma.charge.findMany).mockResolvedValue([existingCharge]);
      vi.mocked(prisma.charge.createMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { ...existingCharge, description: 'New Description', unitPrice: 80 },
      ]);

      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#New Description#1#szt#80#80,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');

      const result = await importChargesFromBuffer(buffer, mockHOA.externalId);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should skip charges for non-existent apartments', async () => {
      const mockHOA = createMockHOA({ externalId: 'hoa1' });

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.charge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.charge.createMany).mockResolvedValue({ count: 0 });

      const mockData =
        'W00162#hoa1-hoa1-00000-00999M#01/01/2025#31/01/2025#202501#1#Test#1#szt#73#73,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');

      const result = await importChargesFromBuffer(buffer, mockHOA.externalId);

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should handle different charge types correctly', async () => {
      const mockHOA = createMockHOA({ externalId: 'hoa1' });
      const mockApartment = {
        id: 'apt-1',
        externalId: 'hoa1-hoa1-00000-00001M',
        number: '1',
        owner: 'John Doe',
        address: null,
        building: null,
        postalCode: null,
        city: null,
        floors: null,
        locationType: null,
        area: null,
        height: null,
        isActive: true,
        homeownersAssociationId: mockHOA.id,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([mockApartment]);
      vi.mocked(prisma.charge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.charge.createMany).mockResolvedValue({ count: 2 });

      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Zarządzanie Nieruchomością Wspólną#1#szt#73#73,00\n' +
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#2#Koszta zarządu - eksploatacja#1#szt.#245#245,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');

      const result = await importChargesFromBuffer(buffer, mockHOA.externalId);

      expect(result.created).toBe(2);

      expect(prisma.charge.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            description: 'Zarządzanie Nieruchomością Wspólną',
            unit: 'szt',
          }),
          expect.objectContaining({
            description: 'Koszta zarządu - eksploatacja',
            unit: 'szt.',
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should handle multiple apartments', async () => {
      const mockHOA = createMockHOA({ externalId: 'hoa1' });
      const mockApartment1 = {
        id: 'apt-1',
        externalId: 'hoa1-hoa1-00000-00001M',
        number: '1',
        owner: 'John Doe',
        address: null,
        building: null,
        postalCode: null,
        city: null,
        floors: null,
        locationType: null,
        area: null,
        height: null,
        isActive: true,
        homeownersAssociationId: mockHOA.id,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockApartment2 = {
        id: 'apt-2',
        externalId: 'hoa1-hoa1-00000-00002M',
        number: '2',
        owner: 'Jane Doe',
        address: null,
        building: null,
        postalCode: null,
        city: null,
        floors: null,
        locationType: null,
        area: null,
        height: null,
        isActive: true,
        homeownersAssociationId: mockHOA.id,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([
        mockApartment1,
        mockApartment2,
      ]);
      vi.mocked(prisma.charge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.charge.createMany).mockResolvedValue({ count: 2 });

      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Test1#1#szt#73#73,00\n' +
        'W00163#hoa1-hoa1-00000-00002M#01/01/2025#31/01/2025#202501#1#Test2#1#szt#73#73,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');

      const result = await importChargesFromBuffer(buffer, mockHOA.externalId);

      expect(result.created).toBe(2);

      expect(prisma.charge.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            description: 'Test1',
            apartmentId: mockApartment1.id,
          }),
          expect.objectContaining({
            description: 'Test2',
            apartmentId: mockApartment2.id,
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should return error if HOA not found', async () => {
      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        null
      );

      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Test#1#szt#73#73,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');

      const result = await importChargesFromBuffer(buffer, 'NON_EXISTENT');

      expect(result.created).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not found');
    });

    it('should handle parse errors gracefully', async () => {
      const mockHOA = createMockHOA({ externalId: 'hoa1' });

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.charge.findMany).mockResolvedValue([]);

      const invalidBuffer = Buffer.from('invalid data');

      const result = await importChargesFromBuffer(
        invalidBuffer,
        mockHOA.externalId
      );

      expect(result.total).toBe(0);
      expect(result.created).toBe(0);
    });
  });
});
