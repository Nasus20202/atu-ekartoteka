import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  confirmationCodeMatches,
  confirmationExpiry,
  generateConfirmationCode,
  hashConfirmationCode,
  isConfirmationCodeFormat,
  isResendTooSoon,
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

  it('refuses a new code within a minute of the previous one', () => {
    const issued = new Date('2026-06-01T12:00:00Z');
    const expiresAt = confirmationExpiry(issued);

    expect(isResendTooSoon(expiresAt, new Date('2026-06-01T12:00:30Z'))).toBe(
      true
    );
    expect(isResendTooSoon(expiresAt, new Date('2026-06-01T12:01:00Z'))).toBe(
      false
    );
  });
});
