import iconv from 'iconv-lite';
import { describe, expect, it } from 'vitest';

import {
  createMockApartmentEntry,
  mockApartmentEntries,
} from '@/__tests__/fixtures';
import {
  ApartmentEntry,
  getUniqueApartments,
  parseApartmentBuffer,
} from '@/lib/parsers/apartment-parser';

describe('apartment-parser', () => {
  describe('parseApartmentBuffer', () => {
    it('should parse buffer with ISO 8859-2 encoding', async () => {
      const mockData =
        'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com##50.5#250\n';
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseApartmentBuffer(buffer);

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(1);
    });

    it('should correctly parse entry fields', async () => {
      const mockData =
        'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com###50.5#250\n';
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseApartmentBuffer(buffer);
      const firstEntry = entries[0];

      expect(firstEntry).toHaveProperty('externalOwnerId', 'W1');
      expect(firstEntry).toHaveProperty('externalApartmentId', 'EXT001');
      expect(firstEntry).toHaveProperty('owner', 'Jan Kowalski');
      expect(firstEntry).toHaveProperty('email', 'jan@example.com');
      expect(firstEntry).toHaveProperty('address', 'ul. Testowa');
      expect(firstEntry).toHaveProperty('building', '1');
      expect(firstEntry).toHaveProperty('number', '1');
      expect(firstEntry).toHaveProperty('postalCode', '00-001');
      expect(firstEntry).toHaveProperty('city', 'Warszawa');
      expect(firstEntry).toHaveProperty('shareNumerator', 50.5);
      expect(firstEntry).toHaveProperty('shareDenominator', 250);
      expect(firstEntry).toHaveProperty('isOwner', true);
    });

    it('should correctly identify owner entries', async () => {
      const mockData =
        'W1#Owner#owner@example.com#EXT001#Address#1#1#00-001#City####50#250\nL1#Tenant#tenant@example.com#EXT001#Address#1#1#00-001#City####50#250\n';
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseApartmentBuffer(buffer);

      const ownerEntries = entries.filter((e) => e.isOwner);
      expect(ownerEntries.length).toBe(1);
      expect(ownerEntries[0].externalOwnerId).toBe('W1');
    });

    it('should parse area and height as numbers', async () => {
      const mockData =
        'W1#Owner##EXT001#Address#1#1#00-001#City#owner@example.com###50.5#250.75\n';
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseApartmentBuffer(buffer);
      const firstEntry = entries[0];

      expect(typeof firstEntry.shareNumerator).toBe('number');
      expect(firstEntry.shareNumerator).toBe(50.5);
      expect(typeof firstEntry.shareDenominator).toBe('number');
      expect(firstEntry.shareDenominator).toBe(250.75);
    });

    it('should handle Polish characters correctly', async () => {
      const mockData =
        'W1#Janusz Kowalski##EXT001#ul. Łąkowa#1#1#00-001#Kraków#janusz@example.com###50.5#250\n';
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseApartmentBuffer(buffer);

      expect(entries[0].owner).toBe('Janusz Kowalski');
      expect(entries[0].address).toBe('ul. Łąkowa');
      expect(entries[0].city).toBe('Kraków');
    });

    it('should handle owner names with one hashtag', async () => {
      const mockData =
        'W1#Jan#Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com###50.5#250\n';
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseApartmentBuffer(buffer);

      expect(entries[0].owner).toBe('Jan#Kowalski');
      expect(entries[0].externalOwnerId).toBe('W1');
      expect(entries[0].externalApartmentId).toBe('EXT001');
      expect(entries[0].email).toBe('jan@example.com');
    });

    it('should handle owner names with multiple hashtags', async () => {
      const mockData =
        'W1#Jan#Piotr#Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com###50.5#250\n';
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseApartmentBuffer(buffer);

      expect(entries[0].owner).toBe('Jan#Piotr#Kowalski');
      expect(entries[0].externalOwnerId).toBe('W1');
      expect(entries[0].externalApartmentId).toBe('EXT001');
      expect(entries[0].address).toBe('ul. Testowa');
      expect(entries[0].city).toBe('Warszawa');
    });
  });

  describe('getUniqueApartments', () => {
    it('should filter only owner entries', () => {
      const entries: ApartmentEntry[] = [
        createMockApartmentEntry({
          owner: 'Owner 1',
          address: 'Address 1',
          shareNumerator: 50,
          shareDenominator: 2.5,
        }),
        mockApartmentEntries.tenant,
      ];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(1);
      expect(unique[0].isOwner).toBe(true);
      expect(unique[0].externalOwnerId).toBe('W1');
    });

    it('should return unique apartments by externalOwnerId+externalApartmentId', () => {
      const entries: ApartmentEntry[] = [
        createMockApartmentEntry({
          owner: 'Owner 1',
          address: 'Address 1',
          shareNumerator: 50,
          shareDenominator: 2.5,
        }),
        createMockApartmentEntry({
          externalOwnerId: 'W2',
          externalApartmentId: 'EXT2',
          owner: 'Owner 2',
          address: 'Address 1',
          shareNumerator: 50,
          shareDenominator: 2.5,
        }),
        mockApartmentEntries.secondOwner,
      ];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(2);
      expect(unique[0].externalOwnerId).toBe('W1');
      expect(unique[0].externalApartmentId).toBe('EXT1');
      expect(unique[1].externalOwnerId).toBe('W2');
      expect(unique[1].externalApartmentId).toBe('EXT2');
    });

    it('should return empty array when no owner entries exist', () => {
      const entries: ApartmentEntry[] = [mockApartmentEntries.tenant];

      const unique = getUniqueApartments(entries);

      expect(unique.length).toBe(0);
    });
  });
});
