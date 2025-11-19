import { describe, expect, it } from 'vitest';

import { parsePowCzynszFile } from '@/lib/pow-czynsz-parser';

describe('parsePowCzynszFile', () => {
  it('should parse pow_czynsz.txt file correctly', async () => {
    const iconv = await import('iconv-lite');
    const content = `Header line 1
Header line 2
#
W00162#KLO11-KLO11-00000-00001M#1#Koszta zarządu - eksploatacja#1#szt.#245#245,00
W00162#KLO11-KLO11-00000-00001M#2#Zarządzanie Nieruchomością Wspólną#1#szt#73#73,00
W00163#KLO11-KLO11-00000-00002M#1#Koszta zarządu - eksploatacja#1#szt.#245#245,00`;
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parsePowCzynszFile(buffer);

    expect(result.entries).toHaveLength(3);
    expect(result.entries[0]).toEqual({
      externalId: 'W00162',
      apartmentCode: 'KLO11-KLO11-00000-00001M',
      lineNo: 1,
      description: 'Koszta zarządu - eksploatacja',
      quantity: 1,
      unit: 'szt.',
      unitPrice: 245,
      totalAmount: 245.0,
    });
    expect(result.entries[1]).toEqual({
      externalId: 'W00162',
      apartmentCode: 'KLO11-KLO11-00000-00001M',
      lineNo: 2,
      description: 'Zarządzanie Nieruchomością Wspólną',
      quantity: 1,
      unit: 'szt',
      unitPrice: 73,
      totalAmount: 73.0,
    });
  });

  it('should handle empty file', async () => {
    const iconv = await import('iconv-lite');
    const content = '';
    const buffer = iconv.encode(content, 'iso-8859-2');
    const result = await parsePowCzynszFile(buffer);

    expect(result.entries).toHaveLength(0);
    expect(result.header).toHaveLength(0);
  });

  it('should extract header and footer', async () => {
    const iconv = await import('iconv-lite');
    const content = `Header line 1
Header line 2
#
W00162#KLO11-KLO11-00000-00001M#1#Test#1#szt#100#100,00
Footer line 1`;
    const buffer = iconv.encode(content, 'iso-8859-2');

    const result = await parsePowCzynszFile(buffer);

    expect(result.entries).toHaveLength(1);
    expect(result.footer).toBeDefined();
    expect(result.footer).toHaveLength(1);
    expect(result.footer?.[0]).toBe('Footer line 1');
  });
});
