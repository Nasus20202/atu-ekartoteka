import { describe, expect, it } from 'vitest';

import { createMockLokEntry, mockLokEntries } from '@/__tests__/fixtures';
import {
  getUniqueApartments,
  LokEntry,
  parseLokBuffer,
} from '@/lib/lok-parser';

describe('lok-parser', () => {
  describe('parseLokBuffer', () => {
    it('should parse buffer with ISO 8859-2 encoding', async () => {
      const mockData =
        'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa###50.5#250\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseLokBuffer(buffer);

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(1);
    });

    it('should correctly parse entry fields', async () => {
      const mockData =
        'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa####50.5#250\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseLokBuffer(buffer);
      const firstEntry = entries[0];

      expect(firstEntry).toHaveProperty('id', 'W1');
      expect(firstEntry).toHaveProperty('owner', 'Jan Kowalski');
      expect(firstEntry).toHaveProperty('externalId', 'EXT001');
      expect(firstEntry).toHaveProperty('address', 'ul. Testowa');
      expect(firstEntry).toHaveProperty('building', '1');
      expect(firstEntry).toHaveProperty('number', '1');
      expect(firstEntry).toHaveProperty('postalCode', '00-001');
      expect(firstEntry).toHaveProperty('city', 'Warszawa');
      expect(firstEntry).toHaveProperty('area', 50.5);
      expect(firstEntry).toHaveProperty('height', 250);
      expect(firstEntry).toHaveProperty('isOwner', true);
    });

    it('should correctly identify owner entries', async () => {
      const mockData =
        'W1#Owner##EXT001#Address#1#1#00-001#City####50#250\nL1#Tenant##EXT001#Address#1#1#00-001#City####50#250\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseLokBuffer(buffer);

      const ownerEntries = entries.filter((e) => e.isOwner);
      expect(ownerEntries.length).toBe(1);
      expect(ownerEntries[0].id).toBe('W1');
    });

    it('should parse area and height as numbers', async () => {
      const mockData =
        'W1#Owner##EXT001#Address#1#1#00-001#City####50.5#250.75\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseLokBuffer(buffer);
      const firstEntry = entries[0];

      expect(typeof firstEntry.area).toBe('number');
      expect(firstEntry.area).toBe(50.5);
      expect(typeof firstEntry.height).toBe('number');
      expect(firstEntry.height).toBe(250.75);
    });

    it('should handle Polish characters correctly', async () => {
      const mockData =
        'W1#Janusz Kowalski##EXT001#ul. Łąkowa#1#1#00-001#Kraków####50#250\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseLokBuffer(buffer);

      expect(entries[0].owner).toBe('Janusz Kowalski');
      expect(entries[0].address).toBe('ul. Łąkowa');
      expect(entries[0].city).toBe('Kraków');
    });
  });

  describe('getUniqueApartments', () => {
    it('should filter only owner entries', () => {
      const entries: LokEntry[] = [
        createMockLokEntry({
          owner: 'Owner 1',
          address: 'Address 1',
          area: 50,
          height: 2.5,
        }),
        mockLokEntries.tenant,
      ];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(1);
      expect(unique[0].isOwner).toBe(true);
      expect(unique[0].id).toBe('W1');
    });

    it('should return unique apartments by externalId', () => {
      const entries: LokEntry[] = [
        createMockLokEntry({
          owner: 'Owner 1',
          address: 'Address 1',
          area: 50,
          height: 2.5,
        }),
        createMockLokEntry({
          id: 'W2',
          owner: 'Owner 2',
          address: 'Address 1',
          area: 50,
          height: 2.5,
        }),
        mockLokEntries.secondOwner,
      ];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(2);
      expect(unique[0].externalId).toBe('EXT1');
      expect(unique[1].externalId).toBe('EXT2');
    });

    it('should return empty array when no owner entries exist', () => {
      const entries: LokEntry[] = [mockLokEntries.tenant];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(0);
    });
  });
});
