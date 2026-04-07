import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createRegistrationAutoLoginToken,
  verifyRegistrationAutoLoginToken,
} from '@/lib/auth/registration-auto-login-token';

const SECRET = 'test-secret-value';

describe('registration-auto-login-token', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_SECRET', SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('createRegistrationAutoLoginToken', () => {
    it('returns a token string when secret is set', () => {
      const token = createRegistrationAutoLoginToken('user@example.com');
      expect(token).toBeTypeOf('string');
      expect(token).toContain('.');
    });

    it('returns null when no secret is configured', () => {
      vi.unstubAllEnvs();
      const token = createRegistrationAutoLoginToken('user@example.com');
      expect(token).toBeNull();
    });

    it('uses AUTH_SECRET as fallback when NEXTAUTH_SECRET is absent', () => {
      vi.unstubAllEnvs();
      vi.stubEnv('AUTH_SECRET', SECRET);
      const token = createRegistrationAutoLoginToken('user@example.com');
      expect(token).toBeTypeOf('string');
    });

    it('encodes email in the token payload', () => {
      const email = 'encoded@example.com';
      const token = createRegistrationAutoLoginToken(email);
      const [payloadPart] = token!.split('.');
      const payload = JSON.parse(
        Buffer.from(payloadPart, 'base64url').toString('utf8')
      );
      expect(payload.email).toBe(email);
    });

    it('includes a future expiry in the token payload', () => {
      const before = Date.now();
      const token = createRegistrationAutoLoginToken('user@example.com');
      const after = Date.now();
      const [payloadPart] = token!.split('.');
      const payload = JSON.parse(
        Buffer.from(payloadPart, 'base64url').toString('utf8')
      );
      expect(payload.exp).toBeGreaterThan(before);
      expect(payload.exp).toBeLessThanOrEqual(after + 15_000 + 50);
    });
  });

  describe('verifyRegistrationAutoLoginToken', () => {
    it('returns true for a valid token with matching email', () => {
      const email = 'valid@example.com';
      const token = createRegistrationAutoLoginToken(email)!;
      expect(verifyRegistrationAutoLoginToken(token, email)).toBe(true);
    });

    it('returns false when no secret is configured', () => {
      const email = 'user@example.com';
      const token = createRegistrationAutoLoginToken(email)!;
      vi.unstubAllEnvs();
      expect(verifyRegistrationAutoLoginToken(token, email)).toBe(false);
    });

    it('returns false when token is undefined', () => {
      expect(
        verifyRegistrationAutoLoginToken(undefined, 'user@example.com')
      ).toBe(false);
    });

    it('returns false when token has no dot separator', () => {
      expect(
        verifyRegistrationAutoLoginToken('nodot', 'user@example.com')
      ).toBe(false);
    });

    it('returns false when signature is tampered', () => {
      const email = 'user@example.com';
      const token = createRegistrationAutoLoginToken(email)!;
      const [payload] = token.split('.');
      const tampered = `${payload}.invalidsignature`;
      expect(verifyRegistrationAutoLoginToken(tampered, email)).toBe(false);
    });

    it('returns false when email does not match', () => {
      const token = createRegistrationAutoLoginToken('real@example.com')!;
      expect(verifyRegistrationAutoLoginToken(token, 'other@example.com')).toBe(
        false
      );
    });

    it('returns false when token is expired', () => {
      const email = 'user@example.com';
      // Build a token with an already-expired timestamp
      const payload = JSON.stringify({ email, exp: Date.now() - 1000 });
      const payloadPart = Buffer.from(payload).toString('base64url');
      const sig = createHmac('sha256', SECRET)
        .update(payloadPart)
        .digest('base64url');
      const expiredToken = `${payloadPart}.${sig}`;
      expect(verifyRegistrationAutoLoginToken(expiredToken, email)).toBe(false);
    });

    it('returns false when payload is not valid JSON', () => {
      const payloadPart = Buffer.from('not-json').toString('base64url');
      const sig = createHmac('sha256', SECRET)
        .update(payloadPart)
        .digest('base64url');
      const badToken = `${payloadPart}.${sig}`;
      expect(
        verifyRegistrationAutoLoginToken(badToken, 'user@example.com')
      ).toBe(false);
    });
  });
});
