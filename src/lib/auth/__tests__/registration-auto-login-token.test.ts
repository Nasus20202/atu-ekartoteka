import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createRegistrationAutoLoginToken,
  verifyRegistrationAutoLoginToken,
} from '@/lib/auth/registration-auto-login-token';

const SECRET = 'test-secret-value';

function sign(payload: unknown): string {
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString(
    'base64url'
  );
  const signature = createHmac('sha256', SECRET)
    .update(payloadPart)
    .digest('base64url');
  return `${payloadPart}.${signature}`;
}

describe('registration-auto-login-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('AUTH_SECRET', SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('createRegistrationAutoLoginToken', () => {
    it('returns a signed token', () => {
      const token = createRegistrationAutoLoginToken('User@Example.com ');

      expect(token).toBeTypeOf('string');
      expect(token).toContain('.');
    });

    it('returns null when no secret is configured', () => {
      vi.unstubAllEnvs();

      expect(createRegistrationAutoLoginToken('user@example.com')).toBeNull();
    });

    it('uses NEXTAUTH_SECRET as a legacy fallback', () => {
      vi.unstubAllEnvs();
      vi.stubEnv('NEXTAUTH_SECRET', SECRET);

      expect(createRegistrationAutoLoginToken('user@example.com')).toBeTypeOf(
        'string'
      );
    });

    it('encodes the normalised email and a short expiry in the payload', () => {
      const before = Date.now();
      const token = createRegistrationAutoLoginToken(' User@Example.com ')!;
      const [payloadPart] = token.split('.');
      const payload = JSON.parse(
        Buffer.from(payloadPart, 'base64url').toString('utf8')
      );

      expect(payload.email).toBe('user@example.com');
      expect(payload.exp).toBeGreaterThan(before);
      expect(payload.exp).toBeLessThanOrEqual(before + 15_000 + 50);
    });
  });

  describe('verifyRegistrationAutoLoginToken', () => {
    it('accepts a valid token with matching email', () => {
      const token = createRegistrationAutoLoginToken('valid@example.com')!;

      expect(verifyRegistrationAutoLoginToken(token, 'VALID@example.com')).toBe(
        true
      );
    });

    it('rejects when no secret is configured', () => {
      const token = createRegistrationAutoLoginToken('user@example.com')!;
      vi.unstubAllEnvs();

      expect(verifyRegistrationAutoLoginToken(token, 'user@example.com')).toBe(
        false
      );
    });

    it('rejects an undefined token', () => {
      expect(
        verifyRegistrationAutoLoginToken(undefined, 'user@example.com')
      ).toBe(false);
    });

    it('rejects a token without a dot separator', () => {
      expect(
        verifyRegistrationAutoLoginToken('nodot', 'user@example.com')
      ).toBe(false);
    });

    it('rejects a tampered signature', () => {
      const token = createRegistrationAutoLoginToken('user@example.com')!;
      const [payload] = token.split('.');

      expect(
        verifyRegistrationAutoLoginToken(
          `${payload}.invalidsignature`,
          'user@example.com'
        )
      ).toBe(false);
    });

    it('rejects a mismatched email', () => {
      const token = createRegistrationAutoLoginToken('real@example.com')!;

      expect(verifyRegistrationAutoLoginToken(token, 'other@example.com')).toBe(
        false
      );
    });

    it('rejects an expired token', () => {
      const token = sign({
        email: 'user@example.com',
        exp: Date.now() - 1000,
      });

      expect(verifyRegistrationAutoLoginToken(token, 'user@example.com')).toBe(
        false
      );
    });

    it('rejects a payload without an email', () => {
      const token = sign({ exp: Date.now() + 10_000 });

      expect(verifyRegistrationAutoLoginToken(token, 'user@example.com')).toBe(
        false
      );
    });

    it('rejects a payload without an expiry', () => {
      const token = sign({ email: 'user@example.com' });

      expect(verifyRegistrationAutoLoginToken(token, 'user@example.com')).toBe(
        false
      );
    });

    it('rejects a payload that is not valid JSON', () => {
      const payloadPart = Buffer.from('not-json').toString('base64url');
      const sig = createHmac('sha256', SECRET)
        .update(payloadPart)
        .digest('base64url');

      expect(
        verifyRegistrationAutoLoginToken(
          `${payloadPart}.${sig}`,
          'user@example.com'
        )
      ).toBe(false);
    });
  });
});
