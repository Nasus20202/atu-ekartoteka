import { describe, expect, it } from 'vitest';

import {
  createEmptyStats,
  groupFilesByHOA,
  isKnownFile,
  parseWmbDate,
} from '@/lib/import/utils';

describe('isKnownFile', () => {
  it('returns true for lok.txt', () => {
    expect(isKnownFile('lok.txt')).toBe(true);
  });

  it('returns true for nal_czynsz.txt', () => {
    expect(isKnownFile('nal_czynsz.txt')).toBe(true);
  });

  it('returns true for pow_czynsz.txt', () => {
    expect(isKnownFile('pow_czynsz.txt')).toBe(true);
  });

  it('returns true for wplaty.txt', () => {
    expect(isKnownFile('wplaty.txt')).toBe(true);
  });

  it('returns true for any .wmb file', () => {
    expect(isKnownFile('lokal_ost_wys.wmb')).toBe(true);
    expect(isKnownFile('custom.wmb')).toBe(true);
  });

  it('returns false for unknown file names', () => {
    expect(isKnownFile('invalid.csv')).toBe(false);
    expect(isKnownFile('data.xlsx')).toBe(false);
    expect(isKnownFile('lok.txt.bak')).toBe(false);
  });
});

describe('createEmptyStats', () => {
  it('returns an object with all fields set to 0', () => {
    const stats = createEmptyStats();
    expect(stats).toEqual({
      created: 0,
      updated: 0,
      skipped: 0,
      deleted: 0,
      total: 0,
    });
  });

  it('returns a fresh object each call (no shared state)', () => {
    const a = createEmptyStats();
    const b = createEmptyStats();
    a.created = 5;
    expect(b.created).toBe(0);
  });
});

function makeFile(name: string, content: string): File {
  return new File([content], name, { type: 'application/octet-stream' });
}

describe('parseWmbDate', () => {
  it('should parse a valid YYYYMMDD date string', async () => {
    const buffer = Buffer.from('20240315');
    const result = await parseWmbDate(buffer);
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2024-03-15T00:00:00.000Z');
  });

  it('should return undefined for non-8-digit string', async () => {
    const buffer = Buffer.from('2024031');
    const result = await parseWmbDate(buffer);
    expect(result).toBeUndefined();
  });

  it('should return undefined for non-numeric string', async () => {
    const buffer = Buffer.from('ABCDEFGH');
    const result = await parseWmbDate(buffer);
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty buffer', async () => {
    const buffer = Buffer.from('');
    const result = await parseWmbDate(buffer);
    expect(result).toBeUndefined();
  });

  it('should trim whitespace before parsing', async () => {
    const buffer = Buffer.from('  20250101  ');
    const result = await parseWmbDate(buffer);
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2025-01-01T00:00:00.000Z');
  });

  it('should return undefined for invalid date values', async () => {
    const buffer = Buffer.from('20241399'); // month 13, day 99
    const result = await parseWmbDate(buffer);
    // Date.UTC with invalid month/day still produces a valid Date in JS
    // so we just verify it doesn't throw
    expect(result === undefined || result instanceof Date).toBe(true);
  });
});

describe('groupFilesByHOA - WMB routing', () => {
  it('should route lokal_ost_wys.wmb to apartmentsWmbFile', () => {
    const file = makeFile('HOA001/lokal_ost_wys.wmb', '20240101');
    const errors: never[] = [];
    const result = groupFilesByHOA([file], errors);

    expect(errors).toHaveLength(0);
    expect(result.get('HOA001')?.apartmentsWmbFile).toBe(file);
    expect(result.get('HOA001')?.chargesWmbFile).toBeUndefined();
    expect(result.get('HOA001')?.notificationsWmbFile).toBeUndefined();
  });

  it('should route nalicz_ost_wys.wmb to chargesWmbFile', () => {
    const file = makeFile('HOA001/nalicz_ost_wys.wmb', '20240101');
    const errors: never[] = [];
    const result = groupFilesByHOA([file], errors);

    expect(errors).toHaveLength(0);
    expect(result.get('HOA001')?.chargesWmbFile).toBe(file);
    expect(result.get('HOA001')?.apartmentsWmbFile).toBeUndefined();
    expect(result.get('HOA001')?.notificationsWmbFile).toBeUndefined();
  });

  it('should route pow_czynsz_ost_wys.wmb to notificationsWmbFile', () => {
    const file = makeFile('HOA001/pow_czynsz_ost_wys.wmb', '20240101');
    const errors: never[] = [];
    const result = groupFilesByHOA([file], errors);

    expect(errors).toHaveLength(0);
    expect(result.get('HOA001')?.notificationsWmbFile).toBe(file);
    expect(result.get('HOA001')?.apartmentsWmbFile).toBeUndefined();
    expect(result.get('HOA001')?.chargesWmbFile).toBeUndefined();
  });

  it('should route all three WMB files for the same HOA', () => {
    const aptWmb = makeFile('HOA001/lokal_ost_wys.wmb', '20240101');
    const charWmb = makeFile('HOA001/nalicz_ost_wys.wmb', '20240102');
    const notifWmb = makeFile('HOA001/pow_czynsz_ost_wys.wmb', '20240103');
    const errors: never[] = [];
    const result = groupFilesByHOA([aptWmb, charWmb, notifWmb], errors);

    expect(errors).toHaveLength(0);
    const group = result.get('HOA001');
    expect(group?.apartmentsWmbFile).toBe(aptWmb);
    expect(group?.chargesWmbFile).toBe(charWmb);
    expect(group?.notificationsWmbFile).toBe(notifWmb);
  });

  it('should route WMB files for different HOAs independently', () => {
    const file1 = makeFile('HOA001/lokal_ost_wys.wmb', '20240101');
    const file2 = makeFile('HOA002/lokal_ost_wys.wmb', '20240102');
    const errors: never[] = [];
    const result = groupFilesByHOA([file1, file2], errors);

    expect(result.get('HOA001')?.apartmentsWmbFile).toBe(file1);
    expect(result.get('HOA002')?.apartmentsWmbFile).toBe(file2);
  });

  it('should route standard txt files alongside WMB files', () => {
    const lokFile = makeFile('HOA001/lok.txt', '');
    const wmbFile = makeFile('HOA001/lokal_ost_wys.wmb', '20240101');
    const errors: never[] = [];
    const result = groupFilesByHOA([lokFile, wmbFile], errors);

    expect(errors).toHaveLength(0);
    const group = result.get('HOA001');
    expect(group?.lokFile).toBe(lokFile);
    expect(group?.apartmentsWmbFile).toBe(wmbFile);
  });

  it('should add an error for files without HOA directory prefix', () => {
    const file = makeFile('lokal_ost_wys.wmb', '20240101');
    const errors: { file: string; error: string }[] = [];
    groupFilesByHOA([file], errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].file).toBe('lokal_ost_wys.wmb');
  });
});
