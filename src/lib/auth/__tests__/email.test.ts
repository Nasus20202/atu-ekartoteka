import { describe, expect, it } from 'vitest';

import { normalizeEmail } from '@/lib/auth/email';

describe('normalizeEmail', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  jan@example.com  ')).toBe('jan@example.com');
  });

  it('lowercases the address', () => {
    expect(normalizeEmail('Jan.Doe@Example.COM')).toBe('jan.doe@example.com');
  });

  it('leaves an already normalised address unchanged', () => {
    expect(normalizeEmail('jan@example.com')).toBe('jan@example.com');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeEmail('')).toBe('');
  });
});
