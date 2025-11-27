import { describe, expect, it } from 'vitest';

import { parseNalCzynszBuffer } from '@/lib/parsers/nal-czynsz-parser';

describe('nal-czynsz-parser', () => {
  describe('parseNalCzynszBuffer', () => {
    it('should parse buffer with ISO 8859-2 encoding', async () => {
      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Zarządzanie Nieruchomością Wspólną#1#szt#73#73,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(1);
    });

    it('should correctly parse entry fields', async () => {
      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Zarządzanie Nieruchomością Wspólną#1#szt#73#73,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);
      const firstEntry = entries[0];

      expect(firstEntry).toHaveProperty('id', 'W00162');
      expect(firstEntry).toHaveProperty(
        'apartmentExternalId',
        'hoa1-hoa1-00000-00001M'
      );
      expect(firstEntry).toHaveProperty('period', '202501');
      expect(firstEntry).toHaveProperty('lineNo', 1);
      expect(firstEntry).toHaveProperty(
        'description',
        'Zarządzanie Nieruchomością Wspólną'
      );
      expect(firstEntry).toHaveProperty('quantity', 1);
      expect(firstEntry).toHaveProperty('unit', 'szt');
      expect(firstEntry).toHaveProperty('unitPrice', 73);
      expect(firstEntry).toHaveProperty('totalAmount', 73);
    });

    it('should parse dates correctly', async () => {
      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Test#1#szt#73#73,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);
      const firstEntry = entries[0];

      expect(firstEntry.dateFrom).toBeInstanceOf(Date);
      expect(firstEntry.dateTo).toBeInstanceOf(Date);
      expect(firstEntry.dateFrom.getFullYear()).toBe(2025);
      expect(firstEntry.dateFrom.getMonth()).toBe(0);
      expect(firstEntry.dateFrom.getDate()).toBe(1);
      expect(firstEntry.dateTo.getDate()).toBe(31);
    });

    it('should parse decimal numbers with comma', async () => {
      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Test#1,5#szt#73,50#110,25\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);
      const firstEntry = entries[0];

      expect(firstEntry.quantity).toBe(1.5);
      expect(firstEntry.unitPrice).toBe(73.5);
      expect(firstEntry.totalAmount).toBe(110.25);
    });

    it('should handle Polish characters correctly', async () => {
      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Koszta zarządu - eksploatacja#1#szt.#245#245,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);

      expect(entries[0].description).toBe('Koszta zarządu - eksploatacja');
    });

    it('should skip lines with insufficient fields', async () => {
      const mockData = 'W00162#hoa1-hoa1-00000-00001M#01/01/2025\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);

      expect(entries.length).toBe(0);
    });

    it('should parse multiple entries', async () => {
      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Test1#1#szt#73#73,00\n' +
        'W00163#hoa1-hoa1-00000-00002M#01/01/2025#31/01/2025#202501#1#Test2#1#szt#73#73,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);

      expect(entries.length).toBe(2);
      expect(entries[0].apartmentExternalId).toBe('hoa1-hoa1-00000-00001M');
      expect(entries[1].apartmentExternalId).toBe('hoa1-hoa1-00000-00002M');
    });

    it('should handle multiple charges for same apartment', async () => {
      const mockData =
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#1#Zarządzanie#1#szt#73#73,00\n' +
        'W00162#hoa1-hoa1-00000-00001M#01/01/2025#31/01/2025#202501#2#Eksploatacja#1#szt#245#245,00\n';
      const iconv = await import('iconv-lite');
      const buffer = iconv.encode(mockData, 'iso-8859-2');
      const entries = await parseNalCzynszBuffer(buffer);

      expect(entries.length).toBe(2);
      expect(entries[0].lineNo).toBe(1);
      expect(entries[1].lineNo).toBe(2);
      expect(entries[0].description).toBe('Zarządzanie');
      expect(entries[1].description).toBe('Eksploatacja');
    });
  });
});
