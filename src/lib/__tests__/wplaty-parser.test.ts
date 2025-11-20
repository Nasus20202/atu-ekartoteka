import { describe, expect, it } from 'vitest';

import { parseWplatyFile } from '@/lib/parsers/wplaty-parser';

describe('parseWplatyFile', () => {
  it('should parse wplaty.txt file correctly', async () => {
    const iconv = await import('iconv-lite');
    const content = `W00162#hoa1-hoa1-00000-00001M#2025#01/01/2025#30/11/2025#0#20#0#0#318#620#318#0#318#0#318#0#318#638#318#0#318#0#318#636#318#636#318#0#318#0#0#0#-948,00
W00163#hoa1-hoa1-00000-00002M#2025#01/01/2025#30/11/2025#0#300#0#0#318#310#318#310#318#318#318#318#318#318#318#318#318#0#318#0#318#318#318#318#318#0#0#0#-670,00`;
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      externalId: 'W00162',
      apartmentCode: 'hoa1-hoa1-00000-00001M',
      year: 2025,
      openingBalance: 0,
      totalCharges: 20,
      closingBalance: -948.0,
    });
    expect(result.entries[0].monthlyPayments).toHaveLength(12);
    expect(result.entries[0].monthlyPayments[0]).toBe(0);
    expect(result.entries[0].monthlyPayments[1]).toBe(620);
    expect(result.entries[0].monthlyPayments[2]).toBe(0);
  });

  it('should handle empty file', async () => {
    const iconv = await import('iconv-lite');
    const content = '';
    const buffer = iconv.encode(content, 'iso-8859-2');
    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(0);
  });

  it('should parse dates correctly', async () => {
    const iconv = await import('iconv-lite');
    const content = `W00162#hoa1-hoa1-00000-00001M#2025#01/01/2025#31/12/2025#0#20#0#0#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#0#0#-1180,00`;
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].dateFrom).toEqual(new Date(2025, 0, 1));
    expect(result.entries[0].dateTo).toEqual(new Date(2025, 11, 31));
  });

  it('should handle decimal values with comma', async () => {
    const iconv = await import('iconv-lite');
    const content = `W00162#hoa1-hoa1-00000-00001M#2025#01/01/2025#31/12/2025#100,50#200,75#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#50,25#0#0#-250,50`;
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].openingBalance).toBe(100.5);
    expect(result.entries[0].totalCharges).toBe(200.75);
    expect(result.entries[0].closingBalance).toBe(-250.5);
    expect(result.entries[0].monthlyPayments[0]).toBe(50.25);
  });
});
