import crypto from 'crypto';

import {
  CONFIRMATION_CODE_LENGTH,
  CONFIRMATION_CODE_TTL_MINUTES,
  CONFIRMATION_RATE_LIMIT_MINUTES,
} from '@/lib/voting/rules/voting-constants';

const CODE_PATTERN = new RegExp(`^\\d{${CONFIRMATION_CODE_LENGTH}}$`);
const MS_PER_MINUTE = 60_000;

export function generateConfirmationCode(): string {
  return crypto
    .randomInt(0, 10 ** CONFIRMATION_CODE_LENGTH)
    .toString()
    .padStart(CONFIRMATION_CODE_LENGTH, '0');
}

export function isConfirmationCodeFormat(value: unknown): value is string {
  return typeof value === 'string' && CODE_PATTERN.test(value);
}

/** The code is bound to its confirmation, so a leaked hash is useless elsewhere. */
export function hashConfirmationCode(
  confirmationId: string,
  code: string
): string {
  return crypto
    .createHash('sha256')
    .update(`${confirmationId}:${code}`)
    .digest('hex');
}

export function confirmationCodeMatches(
  expectedHash: string,
  confirmationId: string,
  code: string
): boolean {
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(hashConfirmationCode(confirmationId, code), 'hex');

  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}

export function confirmationExpiry(now: Date): Date {
  return new Date(
    now.getTime() + CONFIRMATION_CODE_TTL_MINUTES * MS_PER_MINUTE
  );
}

/** Start of the window in which a user may have only one code. */
export function rateLimitWindowStart(now: Date): Date {
  return new Date(
    now.getTime() - CONFIRMATION_RATE_LIMIT_MINUTES * MS_PER_MINUTE
  );
}

/** Whole minutes left before another code may be sent; zero once the window is over. */
export function minutesUntilNextCode(issuedAt: Date, now: Date): number {
  const msLeft =
    issuedAt.getTime() +
    CONFIRMATION_RATE_LIMIT_MINUTES * MS_PER_MINUTE -
    now.getTime();

  return Math.max(0, Math.ceil(msLeft / MS_PER_MINUTE));
}

export function newConfirmationId(): string {
  return crypto.randomUUID();
}
