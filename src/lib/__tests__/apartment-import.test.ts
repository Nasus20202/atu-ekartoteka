import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockApartmentEntry,
  mockApartmentEntries,
  mockHOA,
} from '@/__tests__/fixtures';
import { importApartmentsFromBuffer } from '@/lib/import/apartment-import';
import * as apartmentParser from '@/lib/parsers/apartment-parser';

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    homeownersAssociation: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    apartment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/charge-import', () => ({
  importChargesFromBuffer: vi.fn(),
}));

const { prisma } = await import('@/lib/database/prisma');

describe('apartment-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('importApartmentsFromBuffer', () => {
    it('should create HOA if it does not exist', async () => {
      const mockEntries = [createMockApartmentEntry()];

      vi.spyOn(apartmentParser, 'parseApartmentBuffer').mockResolvedValue(
        mockEntries
      );
      vi.spyOn(apartmentParser, 'getUniqueApartments').mockReturnValue(
        mockEntries
      );

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        null
      );
      vi.mocked(prisma.homeownersAssociation.create).mockResolvedValue(mockHOA);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.apartment.create).mockResolvedValue({
        id: '1',
        externalId: 'EXT1',
        owner: 'Jan Kowalski',
        email: 'jan.kowalski@example.com',
        address: 'ul. Testowa 1',
        building: 'B1',
        number: '1',
        postalCode: '00-001',
        city: 'Warszawa',
        area: 50.5,
        height: 2.5,
        isActive: true,
        homeownersAssociationId: 'hoa1',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
      });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const buffer = Buffer.from('mock data');
      await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(prisma.homeownersAssociation.create).toHaveBeenCalledWith({
        data: {
          externalId: 'HOA001',
          name: 'HOA001',
        },
      });
    });

    it('should create new apartments when they do not exist', async () => {
      const mockEntries = [createMockApartmentEntry()];

      vi.spyOn(apartmentParser, 'parseApartmentBuffer').mockResolvedValue(
        mockEntries
      );
      vi.spyOn(apartmentParser, 'getUniqueApartments').mockReturnValue(
        mockEntries
      );

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.apartment.createMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const buffer = Buffer.from('mock data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.total).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.apartment.createMany).toHaveBeenCalledWith({
        data: [
          {
            externalId: 'EXT1',
            owner: 'Jan Kowalski',
            email: 'jan.kowalski@example.com',
            address: 'ul. Testowa 1',
            building: 'B1',
            number: '1',
            postalCode: '00-001',
            city: 'Warszawa',
            area: 50.5,
            height: 2.5,
            isActive: true,
            homeownersAssociationId: 'hoa1',
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should update existing apartments', async () => {
      const mockEntries = [
        createMockApartmentEntry({
          owner: 'Jan Nowak',
          address: 'ul. Testowa 2',
          building: 'B2',
          number: '2',
          postalCode: '00-002',
          city: 'Kraków',
          area: 60.0,
          height: 2.6,
        }),
      ];

      vi.spyOn(apartmentParser, 'parseApartmentBuffer').mockResolvedValue(
        mockEntries
      );
      vi.spyOn(apartmentParser, 'getUniqueApartments').mockReturnValue(
        mockEntries
      );

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([
        {
          externalId: 'EXT1',
          id: '1',
          number: '1',
          owner: null,
          email: null,
          address: null,
          building: null,
          postalCode: null,
          city: null,
          area: null,
          height: null,
          isActive: true,
          homeownersAssociationId: 'hoa-id',
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(prisma.$transaction).mockResolvedValue([
        {
          id: '1',
          externalId: 'EXT1',
          owner: 'Jan Nowak',
          email: 'jan.kowalski@example.com',
          address: 'ul. Testowa 2',
          building: 'B2',
          number: '2',
          postalCode: '00-002',
          city: 'Kraków',
          area: 60.0,
          height: 2.6,
          isActive: true,
          homeownersAssociationId: 'hoa1',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: null,
        },
      ]);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue({
        id: '1',
        externalId: 'EXT1',
        owner: 'Jan Kowalski',
        email: 'jan.kowalski@example.com',
        address: 'ul. Testowa 1',
        building: 'B1',
        number: '1',
        postalCode: '00-001',
        city: 'Warszawa',
        area: 50.5,
        height: 2.5,
        isActive: true,
        homeownersAssociationId: 'hoa1',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
      });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const buffer = Buffer.from('mock data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.total).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.apartment.update).toHaveBeenCalledWith({
        where: { externalId: 'EXT1' },
        data: {
          owner: 'Jan Nowak',
          email: 'jan.kowalski@example.com',
          address: 'ul. Testowa 2',
          building: 'B2',
          number: '2',
          postalCode: '00-002',
          city: 'Kraków',
          area: 60.0,
          height: 2.6,
          isActive: true,
          homeownersAssociationId: 'hoa1',
        },
      });
    });

    it('should deactivate apartments not in the file', async () => {
      const mockEntries = [createMockApartmentEntry()];

      vi.spyOn(apartmentParser, 'parseApartmentBuffer').mockResolvedValue(
        mockEntries
      );
      vi.spyOn(apartmentParser, 'getUniqueApartments').mockReturnValue(
        mockEntries
      );

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.apartment.createMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 2 });

      const buffer = Buffer.from('mock data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.deactivated).toBe(2);
      expect(prisma.apartment.updateMany).toHaveBeenCalledWith({
        where: {
          externalId: {
            notIn: ['EXT1'],
          },
          isActive: true,
          homeownersAssociationId: 'hoa1',
        },
        data: {
          isActive: false,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(apartmentParser, 'parseApartmentBuffer').mockRejectedValue(
        new Error('Parse error')
      );

      const buffer = Buffer.from('invalid data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to parse file');
      expect(result.total).toBe(0);
    });

    it('should continue processing on individual apartment errors', async () => {
      const mockEntries = [
        mockApartmentEntries.owner,
        mockApartmentEntries.secondOwner,
      ];

      vi.spyOn(apartmentParser, 'parseApartmentBuffer').mockResolvedValue(
        mockEntries
      );
      vi.spyOn(apartmentParser, 'getUniqueApartments').mockReturnValue(
        mockEntries
      );

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.apartment.createMany).mockRejectedValue(
        new Error('Database error')
      );
      vi.mocked(prisma.apartment.create)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({
          id: '2',
          externalId: 'EXT2',
          owner: 'Anna Nowak',
          email: 'anna.nowak@example.com',
          address: 'ul. Testowa 2',
          building: 'B2',
          number: '2',
          postalCode: '00-002',
          city: 'Kraków',
          area: 60.0,
          height: 2.6,
          isActive: true,
          homeownersAssociationId: 'hoa1',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: null,
        });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const buffer = Buffer.from('mock data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.created).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Failed to import EXT1');
      expect(result.total).toBe(2);
    });
  });
});
