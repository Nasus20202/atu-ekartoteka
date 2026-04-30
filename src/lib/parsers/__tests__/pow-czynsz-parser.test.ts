import iconv from 'iconv-lite';
import { describe, expect, it } from 'vitest';

import { parsePowCzynszFile } from '@/lib/parsers/pow-czynsz-parser';

function encode(content: string): Buffer {
  return iconv.encode(content, 'iso-8859-2');
}

describe('parsePowCzynszFile', () => {
  it('parses entries with correct two-separator format', async () => {
    const content = `Header line 1
Header line 2
#
Footer line 1
Footer line 2
#
W00162#hoa1-hoa1-00000-00001M#1#Koszta zarządu#1#szt.#245#245,00
W00162#hoa1-hoa1-00000-00001M#2#Zarządzanie#1#szt#73#73,00`;

    const result = await parsePowCzynszFile(encode(content));

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toEqual({
      externalId: 'W00162',
      apartmentCode: 'hoa1-hoa1-00000-00001M',
      lineNo: 1,
      description: 'Koszta zarządu',
      quantity: expect.objectContaining({}),
      unit: 'szt.',
      unitPrice: expect.objectContaining({}),
      totalAmount: expect.objectContaining({}),
    });
    expect(result.entries[0].quantity.toString()).toBe('1');
    expect(result.entries[0].unitPrice.toString()).toBe('245');
    expect(result.entries[0].totalAmount.toString()).toBe('245');
  });

  it('parses quantity and unitPrice as decimals (comma decimal separator)', async () => {
    const content = `#
#
W00001#SYM17-SYM17-00000-00001M#1#Zarządzanie#45,89#m2#1,2300#56,44`;

    const result = await parsePowCzynszFile(encode(content));

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].quantity.toFixed(2)).toBe('45.89');
    expect(result.entries[0].unitPrice.toFixed(4)).toBe('1.2300');
    expect(result.entries[0].totalAmount.toFixed(2)).toBe('56.44');
  });

  it('extracts header lines before first # separator', async () => {
    const content = `Header line 1
Header line 2
#
#
W00162#hoa1-hoa1-00000-00001M#1#Test#1#szt#100#100,00`;

    const result = await parsePowCzynszFile(encode(content));

    expect(result.header).toEqual(['Header line 1', 'Header line 2']);
  });

  it('extracts footer lines between first and second # separator', async () => {
    const content = `#
Footer line 1
Footer line 2
#
W00162#hoa1-hoa1-00000-00001M#1#Test#1#szt#100#100,00`;

    const result = await parsePowCzynszFile(encode(content));

    expect(result.footer).toEqual(['Footer line 1', 'Footer line 2']);
  });

  it('returns empty header and footer when separators are adjacent', async () => {
    const content = `#
#
W00162#hoa1-hoa1-00000-00001M#1#Test#1#szt#100#100,00`;

    const result = await parsePowCzynszFile(encode(content));

    expect(result.header).toHaveLength(0);
    expect(result.footer).toHaveLength(0);
    expect(result.entries).toHaveLength(1);
  });

  it('handles empty file', async () => {
    const result = await parsePowCzynszFile(encode(''));

    expect(result.entries).toHaveLength(0);
    expect(result.header).toHaveLength(0);
    expect(result.footer).toHaveLength(0);
  });
});
