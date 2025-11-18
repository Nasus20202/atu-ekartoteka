import { describe, it, expect, beforeEach, vi } from 'vitest';
import { importApartmentsFromFile } from '../apartment-import';
import * as lokParser from '../lok-parser';

vi.mock('@/lib/prisma', () => ({
  prisma: {
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

  describe('importApartmentsFromFile', () => {
    it('should create new apartments when they do not exist', async () => {
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

      vi.spyOn(lokParser, 'parseLokFile').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

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
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const result = await importApartmentsFromFile('/path/to/file.txt');

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
        },
      });
    });

    it('should update existing apartments', async () => {
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

      vi.spyOn(lokParser, 'parseLokFile').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

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
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const result = await importApartmentsFromFile('/path/to/file.txt');

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
        },
      });
    });

    it('should deactivate apartments not in the file', async () => {
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

      vi.spyOn(lokParser, 'parseLokFile').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

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
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 2 });

      const result = await importApartmentsFromFile('/path/to/file.txt');

      expect(result.deactivated).toBe(2);
      expect(prisma.apartment.updateMany).toHaveBeenCalledWith({
        where: {
          externalId: {
            notIn: ['EXT1'],
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(lokParser, 'parseLokFile').mockRejectedValue(
        new Error('File not found')
      );

      const result = await importApartmentsFromFile('/invalid/path.txt');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to parse file');
      expect(result.total).toBe(0);
    });

    it('should continue processing on individual apartment errors', async () => {
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

      vi.spyOn(lokParser, 'parseLokFile').mockResolvedValue(mockEntries);
      vi.spyOn(lokParser, 'getUniqueApartments').mockReturnValue(mockEntries);

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
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      vi.mocked(prisma.apartment.updateMany).mockResolvedValue({ count: 0 });

      const result = await importApartmentsFromFile('/path/to/file.txt');

      expect(result.created).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Failed to import EXT1');
      expect(result.total).toBe(2);
    });
  });
});
