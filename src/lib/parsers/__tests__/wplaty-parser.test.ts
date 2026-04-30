import iconv from 'iconv-lite';
import { describe, expect, it } from 'vitest';

import { parseWplatyFile } from '@/lib/parsers/wplaty-parser';

describe('parseWplatyFile', () => {
  it('should parse wplaty.txt file correctly', async () => {
    const content = `W00162#hoa1-hoa1-00000-00001M#2025#01/01/2025#30/11/2025#0#20#0#0#318#620#318#0#318#0#318#0#318#638#318#0#318#0#318#636#318#636#318#0#318#0#0#0#-948,00
W00163#hoa1-hoa1-00000-00002M#2025#01/01/2025#30/11/2025#0#300#0#0#318#310#318#310#318#318#318#318#318#318#318#318#318#0#318#0#318#318#318#318#318#0#0#0#-670,00`;
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].externalId).toBe('W00162');
    expect(result.entries[0].apartmentCode).toBe('hoa1-hoa1-00000-00001M');
    expect(result.entries[0].year).toBe(2025);
    expect(result.entries[0].openingBalance.toNumber()).toBe(20);
    expect(result.entries[0].totalCharges.toNumber()).toBe(3498);
    expect(result.entries[0].closingBalance.toNumber()).toBe(-948.0);
    expect(result.entries[0].monthlyPayments).toHaveLength(12);
    expect(result.entries[0].monthlyPayments[0].toNumber()).toBe(620);
    expect(result.entries[0].monthlyPayments[1].toNumber()).toBe(0);
    expect(result.entries[0].monthlyPayments[2].toNumber()).toBe(0);
    expect(result.entries[0].monthlyCharges).toHaveLength(12);
    expect(result.entries[0].monthlyCharges[0].toNumber()).toBe(318);
    expect(result.entries[0].monthlyCharges[1].toNumber()).toBe(318);
  });

  it('should handle empty file', async () => {
    const content = '';
    const buffer = iconv.encode(content, 'iso-8859-2');
    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(0);
  });

  it('should parse dates correctly', async () => {
    const content = `W00162#hoa1-hoa1-00000-00001M#2025#01/01/2025#31/12/2025#100,50#200,75#0#0#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#100#0#0#-1180,00`;
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].dateFrom).toEqual(new Date(2025, 0, 1));
    expect(result.entries[0].dateTo).toEqual(new Date(2025, 11, 31));
  });

  it('should handle decimal values with comma', async () => {
    const parts: string[] = [];
    parts.push(
      'W00162',
      'hoa1-hoa1-00000-00001M',
      '2025',
      '01/01/2025',
      '31/12/2025',
      '100,50',
      '200,75',
      '0',
      '0'
    );
    for (let i = 0; i < 12; i++) {
      parts.push('50,25', '50,25');
    }
    parts.push('-250,50');
    const content = parts.join('#');
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parseWplatyFile(buffer);

    expect(result.entries).toHaveLength(1);
    // openingBalance is surplus - debt
    expect(result.entries[0].openingBalance.toNumber()).toBe(200.75 - 100.5);
    expect(result.entries[0].totalCharges.toNumber()).toBe(50.25 * 12);
    expect(result.entries[0].closingBalance.toNumber()).toBe(-250.5);
    expect(result.entries[0].monthlyPayments[0].toNumber()).toBe(50.25);
    expect(result.entries[0].monthlyCharges[0].toNumber()).toBe(50.25);
  });
});
