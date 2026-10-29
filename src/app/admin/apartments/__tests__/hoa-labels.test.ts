import { describe, expect, it } from 'vitest';

import { formatImportDate } from '@/app/admin/apartments/hoa-labels';

describe('formatImportDate', () => {
  it('formats an ISO date in Polish locale', () => {
    expect(formatImportDate('2025-03-07T12:00:00.000Z')).toBe('7.03.2025');
  });

  it('returns null without a date', () => {
    expect(formatImportDate(null)).toBeNull();
  });
});
