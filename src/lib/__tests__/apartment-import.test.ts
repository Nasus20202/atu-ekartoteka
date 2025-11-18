import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importApartmentsFromBuffer } from '@/lib/apartment-import';
import * as lokParser from '@/lib/lok-parser';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    homeownersAssociation: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    apartment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');

describe('apartment-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('importApartmentsFromBuffer', () => {
    it('should create HOA if it does not exist', async () => {
      const mockEntries = [
        {
          id: 'W1',
          owner: 'Jan Kowalski',
          externalId: 'EXT1',
          address: 'ul. Testowa 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warszawa',
          area: 50.5,
          height: 2.5,
          isOwner: true,
        },
      ];

      vi.spyOn(lokParser, 'parseLokBuffer').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        null
      );
      vi.mocked(prisma.homeownersAssociation.create).mockResolvedValue({
        id: 'hoa1',
        externalId: 'HOA001',
        name: 'HOA001',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.apartment.create).mockResolvedValue({
        id: '1',
        externalId: 'EXT1',
        owner: 'Jan Kowalski',
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
      const mockHOA = {
        id: 'hoa1',
        externalId: 'HOA001',
        name: 'HOA001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntries = [
        {
          id: 'W1',
          owner: 'Jan Kowalski',
          externalId: 'EXT1',
          address: 'ul. Testowa 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warszawa',
          area: 50.5,
          height: 2.5,
          isOwner: true,
        },
      ];

      vi.spyOn(lokParser, 'parseLokBuffer').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.apartment.create).mockResolvedValue({
        id: '1',
        externalId: 'EXT1',
        owner: 'Jan Kowalski',
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
      });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const buffer = Buffer.from('mock data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.total).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.apartment.create).toHaveBeenCalledWith({
        data: {
          externalId: 'EXT1',
          owner: 'Jan Kowalski',
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
      });
    });

    it('should update existing apartments', async () => {
      const mockHOA = {
        id: 'hoa1',
        externalId: 'HOA001',
        name: 'HOA001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntries = [
        {
          id: 'W1',
          owner: 'Jan Nowak',
          externalId: 'EXT1',
          address: 'ul. Testowa 2',
          building: 'B2',
          number: '2',
          postalCode: '00-002',
          city: 'Kraków',
          area: 60.0,
          height: 2.6,
          isOwner: true,
        },
      ];

      vi.spyOn(lokParser, 'parseLokBuffer').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue({
        id: '1',
        externalId: 'EXT1',
        owner: 'Jan Kowalski',
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
      });
      vi.mocked(prisma.apartment.update).mockResolvedValue({
        id: '1',
        externalId: 'EXT1',
        owner: 'Jan Nowak',
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
      });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const buffer = Buffer.from('mock data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.total).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.apartment.update).toHaveBeenCalledWith({
        where: { externalId: 'EXT1' },
        data: {
          owner: 'Jan Nowak',
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
      const mockHOA = {
        id: 'hoa1',
        externalId: 'HOA001',
        name: 'HOA001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntries = [
        {
          id: 'W1',
          owner: 'Jan Kowalski',
          externalId: 'EXT1',
          address: 'ul. Testowa 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warszawa',
          area: 50.5,
          height: 2.5,
          isOwner: true,
        },
      ];

      vi.spyOn(lokParser, 'parseLokBuffer').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.apartment.create).mockResolvedValue({
        id: '1',
        externalId: 'EXT1',
        owner: 'Jan Kowalski',
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
      });
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
      vi.spyOn(lokParser, 'parseLokBuffer').mockRejectedValue(
        new Error('Parse error')
      );

      const buffer = Buffer.from('invalid data');
      const result = await importApartmentsFromBuffer(buffer, 'HOA001');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to parse file');
      expect(result.total).toBe(0);
    });

    it('should continue processing on individual apartment errors', async () => {
      const mockHOA = {
        id: 'hoa1',
        externalId: 'HOA001',
        name: 'HOA001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntries = [
        {
          id: 'W1',
          owner: 'Jan Kowalski',
          externalId: 'EXT1',
          address: 'ul. Testowa 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warszawa',
          area: 50.5,
          height: 2.5,
          isOwner: true,
        },
        {
          id: 'W2',
          owner: 'Anna Nowak',
          externalId: 'EXT2',
          address: 'ul. Testowa 2',
          building: 'B2',
          number: '2',
          postalCode: '00-002',
          city: 'Kraków',
          area: 60.0,
          height: 2.6,
          isOwner: true,
        },
      ];

      vi.spyOn(lokParser, 'parseLokBuffer').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

      vi.mocked(prisma.homeownersAssociation.findUnique).mockResolvedValue(
        mockHOA
      );
      vi.mocked(prisma.apartment.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.apartment.create)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({
          id: '2',
          externalId: 'EXT2',
          owner: 'Anna Nowak',
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
