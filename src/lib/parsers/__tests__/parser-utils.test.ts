import { describe, expect, it } from 'vitest';

import { parseYyyymmdd } from '@/lib/parsers/parser-utils';

describe('parseYyyymmdd', () => {
  it('parses a valid date to midnight UTC', () => {
    expect(parseYyyymmdd('20250210')?.toISOString()).toBe(
      '2025-02-10T00:00:00.000Z'
    );
  });

  it('trims surrounding whitespace', () => {
    expect(parseYyyymmdd(' 20250210\r')?.toISOString()).toBe(
      '2025-02-10T00:00:00.000Z'
    );
  });

  it('returns null for a blank value', () => {
    expect(parseYyyymmdd('')).toBeNull();
    expect(parseYyyymmdd('   ')).toBeNull();
  });

  it('returns null for a malformed value', () => {
    expect(parseYyyymmdd('2025021')).toBeNull();
    expect(parseYyyymmdd('2025-02-10')).toBeNull();
    expect(parseYyyymmdd('ABCDEFGH')).toBeNull();
  });

  it('returns null for a date that does not exist', () => {
    expect(parseYyyymmdd('20250230')).toBeNull();
    expect(parseYyyymmdd('20251301')).toBeNull();
  });
});
