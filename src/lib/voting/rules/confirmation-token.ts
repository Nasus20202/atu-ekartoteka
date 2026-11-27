import crypto from 'crypto';

import {
  CONFIRMATION_RATE_LIMIT_MINUTES,
  CONFIRMATION_TTL_MINUTES,
} from '@/lib/voting/rules/voting-constants';

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MS_PER_MINUTE = 60_000;

/** 256 random bits, so the link cannot be guessed and needs no attempt limit. */
export function generateConfirmationToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

export function isConfirmationTokenFormat(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
}

/** Only the hash is stored, so a leaked table cannot be turned into links. */
export function hashConfirmationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function confirmationExpiry(now: Date): Date {
  return new Date(now.getTime() + CONFIRMATION_TTL_MINUTES * MS_PER_MINUTE);
}

/** Start of the window in which a user may have only one link. */
export function rateLimitWindowStart(now: Date): Date {
  return new Date(
    now.getTime() - CONFIRMATION_RATE_LIMIT_MINUTES * MS_PER_MINUTE
  );
}

/** Whole minutes left before another link may be sent; zero once the window is over. */
export function minutesUntilNextLink(issuedAt: Date, now: Date): number {
  const msLeft =
    issuedAt.getTime() +
    CONFIRMATION_RATE_LIMIT_MINUTES * MS_PER_MINUTE -
    now.getTime();

  return Math.max(0, Math.ceil(msLeft / MS_PER_MINUTE));
}
