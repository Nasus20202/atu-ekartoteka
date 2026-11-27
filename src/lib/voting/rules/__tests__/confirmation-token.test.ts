import { describe, expect, it } from 'vitest';

import {
  confirmationExpiry,
  generateConfirmationToken,
  hashConfirmationToken,
  isConfirmationTokenFormat,
  minutesUntilNextLink,
  rateLimitWindowStart,
} from '@/lib/voting/rules/confirmation-token';

describe('confirmation token', () => {
  it('generates a url-safe token of 256 random bits', () => {
    const token = generateConfirmationToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isConfirmationTokenFormat(token)).toBe(true);
  });

  it('never repeats', () => {
    const tokens = new Set(
      Array.from({ length: 100 }, () => generateConfirmationToken())
    );

    expect(tokens.size).toBe(100);
  });

  it('accepts only the generated format', () => {
    expect(isConfirmationTokenFormat('a'.repeat(43))).toBe(true);
    expect(isConfirmationTokenFormat('a'.repeat(42))).toBe(false);
    expect(isConfirmationTokenFormat('a'.repeat(44))).toBe(false);
    expect(isConfirmationTokenFormat(`${'a'.repeat(42)}/`)).toBe(false);
    expect(isConfirmationTokenFormat(`${'a'.repeat(42)} `)).toBe(false);
    expect(isConfirmationTokenFormat(123456)).toBe(false);
    expect(isConfirmationTokenFormat(undefined)).toBe(false);
  });

  it('hashes deterministically and never stores the token itself', () => {
    const token = generateConfirmationToken();
    const hash = hashConfirmationToken(token);

    expect(hash).toBe(hashConfirmationToken(token));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashConfirmationToken(generateConfirmationToken())).not.toBe(hash);
  });

  it('expires after fifteen minutes', () => {
    const now = new Date('2026-06-01T12:00:00Z');

    expect(confirmationExpiry(now)).toEqual(new Date('2026-06-01T12:15:00Z'));
  });

  it('counts the minutes left in the five minute window, rounding up', () => {
    const issued = new Date('2026-06-01T12:00:00Z');
    const at = (time: string) =>
      minutesUntilNextLink(issued, new Date(`2026-06-01T${time}Z`));

    expect(at('12:00:00')).toBe(5);
    expect(at('12:01:30')).toBe(4);
    expect(at('12:04:59')).toBe(1);
    expect(at('12:05:00')).toBe(0);
    expect(at('13:00:00')).toBe(0);
  });

  it('starts the window five minutes before now', () => {
    expect(rateLimitWindowStart(new Date('2026-06-01T12:05:00Z'))).toEqual(
      new Date('2026-06-01T12:00:00Z')
    );
  });
});
