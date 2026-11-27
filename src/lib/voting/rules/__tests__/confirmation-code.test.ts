import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  confirmationCodeMatches,
  confirmationExpiry,
  generateConfirmationCode,
  hashConfirmationCode,
  isConfirmationCodeFormat,
  minutesUntilNextCode,
  rateLimitWindowStart,
} from '@/lib/voting/rules/confirmation-code';

describe('confirmation code', () => {
  afterEach(() => vi.restoreAllMocks());

  it('generates six digits, keeping leading zeros', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateConfirmationCode()).toMatch(/^\d{6}$/);
    }
  });

  it('accepts only six digits', () => {
    expect(isConfirmationCodeFormat('012345')).toBe(true);
    expect(isConfirmationCodeFormat('12345')).toBe(false);
    expect(isConfirmationCodeFormat('1234567')).toBe(false);
    expect(isConfirmationCodeFormat('12345a')).toBe(false);
    expect(isConfirmationCodeFormat(123456)).toBe(false);
  });

  it('matches only the code of the same confirmation', () => {
    const hash = hashConfirmationCode('c1', '123456');

    expect(confirmationCodeMatches(hash, 'c1', '123456')).toBe(true);
    expect(confirmationCodeMatches(hash, 'c1', '123457')).toBe(false);
    expect(confirmationCodeMatches(hash, 'c2', '123456')).toBe(false);
  });

  it('never stores the code itself', () => {
    expect(hashConfirmationCode('c1', '123456')).not.toContain('123456');
  });

  it('expires after fifteen minutes', () => {
    const now = new Date('2026-06-01T12:00:00Z');

    expect(confirmationExpiry(now)).toEqual(new Date('2026-06-01T12:15:00Z'));
  });

  it('counts the minutes left in the five minute window, rounding up', () => {
    const issued = new Date('2026-06-01T12:00:00Z');

    expect(minutesUntilNextCode(issued, new Date('2026-06-01T12:00:00Z'))).toBe(
      5
    );
    expect(minutesUntilNextCode(issued, new Date('2026-06-01T12:01:30Z'))).toBe(
      4
    );
    expect(minutesUntilNextCode(issued, new Date('2026-06-01T12:04:59Z'))).toBe(
      1
    );
    expect(minutesUntilNextCode(issued, new Date('2026-06-01T12:05:00Z'))).toBe(
      0
    );
    expect(minutesUntilNextCode(issued, new Date('2026-06-01T13:00:00Z'))).toBe(
      0
    );
  });

  it('starts the window five minutes before now', () => {
    expect(rateLimitWindowStart(new Date('2026-06-01T12:05:00Z'))).toEqual(
      new Date('2026-06-01T12:00:00Z')
    );
  });
});
