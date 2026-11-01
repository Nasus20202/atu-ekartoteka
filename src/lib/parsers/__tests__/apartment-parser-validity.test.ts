import iconv from 'iconv-lite';
import { describe, expect, it } from 'vitest';

import { parseApartmentBuffer } from '@/lib/parsers/apartment-parser';

async function parseLine(line: string) {
  const entries = await parseApartmentBuffer(
    iconv.encode(`${line}\n`, 'iso-8859-2')
  );
  return entries[0];
}

describe('apartment-parser owner validity dates', () => {
  it('reads the start and end date of a former owner row', async () => {
    const entry = await parseLine(
      'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com#20250210#20250209#50.5#250'
    );

    expect(entry.validFrom?.toISOString()).toBe('2025-02-10T00:00:00.000Z');
    expect(entry.validTo?.toISOString()).toBe('2025-02-09T00:00:00.000Z');
  });

  it('reads the dates after an owner name with an extra hash', async () => {
    const entry = await parseLine(
      'W1#Jan#Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com#20250210##50.5#250'
    );

    expect(entry.owner).toBe('Jan#Kowalski');
    expect(entry.externalApartmentId).toBe('EXT001');
    expect(entry.validFrom?.toISOString()).toBe('2025-02-10T00:00:00.000Z');
    expect(entry.validTo).toBeNull();
  });

  it('returns a null end date for the current owner', async () => {
    const entry = await parseLine(
      'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com#20250210##50.5#250'
    );

    expect(entry.validTo).toBeNull();
  });

  it('returns a null start date when it is not a valid date', async () => {
    const entry = await parseLine(
      'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com#2025-02-10#20250209#50.5#250'
    );

    expect(entry.validFrom).toBeNull();
    expect(entry.validTo?.toISOString()).toBe('2025-02-09T00:00:00.000Z');
    expect(entry.shareNumerator).toBe(50.5);
  });

  it('reads every row from a CR-only export', async () => {
    const rows = [
      'W1#Jan Kowalski##EXT001#ul. Testowa#1#1#00-001#Warszawa#jan@example.com#20250210#20251231#50.5#250',
      'W2#Anna Nowak##EXT002#ul. Testowa#1#2#00-001#Warszawa#anna@example.com#20260101##60#250',
    ];

    const entries = await parseApartmentBuffer(
      iconv.encode(rows.join('\r'), 'iso-8859-2')
    );

    expect(entries).toHaveLength(2);
    expect(entries[0].validTo?.toISOString()).toBe('2025-12-31T00:00:00.000Z');
    expect(entries[1].validFrom?.toISOString()).toBe(
      '2026-01-01T00:00:00.000Z'
    );
  });
});
