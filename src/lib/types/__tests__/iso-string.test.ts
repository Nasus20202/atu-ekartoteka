import { describe, expect, it } from 'vitest';

import { toIsoString } from '@/lib/types/dto/iso-string';

describe('toIsoString', () => {
  it('serialises dates and keeps strings', () => {
    expect(toIsoString(new Date('2025-01-02T03:04:05.000Z'))).toBe(
      '2025-01-02T03:04:05.000Z'
    );
    expect(toIsoString('2025-01-02')).toBe('2025-01-02');
  });
});
