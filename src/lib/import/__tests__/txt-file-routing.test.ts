import { describe, expect, it } from 'vitest';

import type { ImportError } from '@/lib/import/types';
import { getTxtFileField, groupFilesByHOA } from '@/lib/import/utils';

function makeFile(name: string): File {
  return new File([''], name);
}

describe('getTxtFileField', () => {
  it.each([
    ['lok.txt', 'lokFiles'],
    ['lok_2026.txt', 'lokFiles'],
    ['nal_czynsz.txt', 'chargesFiles'],
    ['nal_czynsztest.txt', 'chargesFiles'],
    ['pow_czynsz_10.txt', 'notificationsFiles'],
    ['wplaty_2026.txt', 'paymentsFiles'],
    ['WPLATY_2026.TXT', 'paymentsFiles'],
  ])('maps %s to %s', (fileName, field) => {
    expect(getTxtFileField(fileName)).toBe(field);
  });

  it.each(['notatki.txt', 'wplaty_2026.csv', 'lok.txt.bak', 'x_wplaty.txt'])(
    'ignores %s',
    (fileName) => {
      expect(getTxtFileField(fileName)).toBeUndefined();
    }
  );
});

describe('groupFilesByHOA - suffixed txt files', () => {
  it('routes suffixed files to their fields', () => {
    const payments = makeFile('HOA001/wplaty_2026.txt');
    const charges = makeFile('HOA001/nal_czynsztest.txt');
    const errors: ImportError[] = [];

    const group = groupFilesByHOA([payments, charges], errors).get('HOA001');

    expect(errors).toHaveLength(0);
    expect(group?.paymentsFiles).toEqual([payments]);
    expect(group?.chargesFiles).toEqual([charges]);
  });

  it('collects several files of the same kind', () => {
    const first = makeFile('HOA001/wplaty1.txt');
    const second = makeFile('HOA001/wplaty2.txt');
    const errors: ImportError[] = [];

    const group = groupFilesByHOA([first, second], errors).get('HOA001');

    expect(errors).toHaveLength(0);
    expect(group?.paymentsFiles).toEqual([first, second]);
  });
});
