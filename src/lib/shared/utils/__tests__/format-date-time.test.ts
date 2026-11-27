import { describe, expect, it } from 'vitest';

import { formatDateTime } from '@/lib/shared/utils/format-date-time';

describe('formatDateTime', () => {
  it('formats in Polish in the Warsaw time zone, whatever the machine zone', () => {
    expect(formatDateTime(new Date('2026-11-27T11:30:00Z'))).toBe(
      '27 listopada 2026 12:30'
    );
    expect(formatDateTime('2026-07-01T10:00:00Z')).toBe('1 lipca 2026 12:00');
  });
});
