import { describe, expect, it } from 'vitest';

import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils';

describe('Charge Utils', () => {
  describe('formatPeriod', () => {
    it('should format period correctly', () => {
      expect(formatPeriod('202501')).toBe('Styczeń 2025');
      expect(formatPeriod('202512')).toBe('Grudzień 2025');
      expect(formatPeriod('202406')).toBe('Czerwiec 2024');
    });

    it('should return period as-is if not in YYYYMM format', () => {
      expect(formatPeriod('2025')).toBe('2025');
      expect(formatPeriod('invalid')).toBe('invalid');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      // Test that currency formatting works
      expect(formatCurrency(100)).toContain('100');
      expect(formatCurrency(100)).toContain('zł');
      expect(formatCurrency(1234.56)).toContain('1234');
      expect(formatCurrency(1234.56)).toContain('56');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date(2025, 0, 15); // January 15, 2025
      const formatted = formatDate(date);
      expect(formatted).toContain('15');
      expect(formatted).toContain('01');
      expect(formatted).toContain('2025');
    });
  });
});
