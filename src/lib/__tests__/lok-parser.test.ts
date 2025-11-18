import { describe, it, expect } from 'vitest';
import { parseLokFile, getUniqueApartments, LokEntry } from '../lok-parser';
import path from 'path';

describe('lok-parser', () => {
  describe('parseLokFile', () => {
    it('should parse lok.txt file with ISO 8859-2 encoding', async () => {
      const filePath = path.join(process.cwd(), 'data', 'lok.txt');
      const entries = await parseLokFile(filePath);

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should correctly parse entry fields', async () => {
      const filePath = path.join(process.cwd(), 'data', 'lok.txt');
      const entries = await parseLokFile(filePath);
      const firstEntry = entries[0];

      expect(firstEntry).toHaveProperty('id');
      expect(firstEntry).toHaveProperty('owner');
      expect(firstEntry).toHaveProperty('externalId');
      expect(firstEntry).toHaveProperty('address');
      expect(firstEntry).toHaveProperty('building');
      expect(firstEntry).toHaveProperty('number');
      expect(firstEntry).toHaveProperty('postalCode');
      expect(firstEntry).toHaveProperty('city');
      expect(firstEntry).toHaveProperty('area');
      expect(firstEntry).toHaveProperty('height');
      expect(firstEntry).toHaveProperty('isOwner');
    });

    it('should correctly identify owner entries', async () => {
      const filePath = path.join(process.cwd(), 'data', 'lok.txt');
      const entries = await parseLokFile(filePath);

      const ownerEntries = entries.filter((e) => e.isOwner);
      expect(ownerEntries.length).toBeGreaterThan(0);

      ownerEntries.forEach((entry) => {
        expect(entry.id.startsWith('W')).toBe(true);
      });
    });

    it('should parse area and height as numbers', async () => {
      const filePath = path.join(process.cwd(), 'data', 'lok.txt');
      const entries = await parseLokFile(filePath);
      const firstEntry = entries[0];

      expect(typeof firstEntry.area).toBe('number');
      expect(typeof firstEntry.height).toBe('number');
    });

    it('should handle Polish characters correctly', async () => {
      const filePath = path.join(process.cwd(), 'data', 'lok.txt');
      const entries = await parseLokFile(filePath);

      // Check that Polish characters are decoded correctly
      // The file should contain Polish characters like ł, ą, ć, etc.
      const hasPolishChars = entries.some(
        (entry) =>
          entry.owner.match(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/) ||
          entry.address.match(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/) ||
          entry.city.match(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/)
      );

      expect(hasPolishChars).toBe(true);
    });
  });

  describe('getUniqueApartments', () => {
    it('should filter only owner entries', () => {
      const entries: LokEntry[] = [
        {
          id: 'W1',
          owner: 'Owner 1',
          externalId: 'EXT1',
          address: 'Address 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warsaw',
          area: 50,
          height: 2.5,
          isOwner: true,
        },
        {
          id: 'L1',
          owner: 'Tenant 1',
          externalId: 'EXT1',
          address: 'Address 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warsaw',
          area: 50,
          height: 2.5,
          isOwner: false,
        },
      ];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(1);
      expect(unique[0].isOwner).toBe(true);
      expect(unique[0].id).toBe('W1');
    });

    it('should return unique apartments by externalId', () => {
      const entries: LokEntry[] = [
        {
          id: 'W1',
          owner: 'Owner 1',
          externalId: 'EXT1',
          address: 'Address 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warsaw',
          area: 50,
          height: 2.5,
          isOwner: true,
        },
        {
          id: 'W2',
          owner: 'Owner 2',
          externalId: 'EXT1',
          address: 'Address 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warsaw',
          area: 50,
          height: 2.5,
          isOwner: true,
        },
        {
          id: 'W3',
          owner: 'Owner 3',
          externalId: 'EXT2',
          address: 'Address 2',
          building: 'B2',
          number: '2',
          postalCode: '00-002',
          city: 'Warsaw',
          area: 60,
          height: 2.6,
          isOwner: true,
        },
      ];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(2);
      expect(unique[0].externalId).toBe('EXT1');
      expect(unique[1].externalId).toBe('EXT2');
    });

    it('should return empty array when no owner entries exist', () => {
      const entries: LokEntry[] = [
        {
          id: 'L1',
          owner: 'Tenant 1',
          externalId: 'EXT1',
          address: 'Address 1',
          building: 'B1',
          number: '1',
          postalCode: '00-001',
          city: 'Warsaw',
          area: 50,
          height: 2.5,
          isOwner: false,
        },
      ];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(0);
    });
  });
});
