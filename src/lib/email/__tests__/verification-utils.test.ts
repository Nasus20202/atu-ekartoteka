import { describe, expect, it } from 'vitest';

import {
  generateSecureToken,
  getVerificationExpiration,
  isVerificationExpired,
} from '@/lib/email/verification-utils';

describe('verification-utils', () => {
  describe('generateSecureToken', () => {
    it('should generate token with sufficient length', () => {
      const token = generateSecureToken();
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate URL-safe tokens', () => {
      const token = generateSecureToken();
      // Should only contain URL-safe characters
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('should be cryptographically random', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('getVerificationExpiration', () => {
    it('should return date in the future', () => {
      const expiration = getVerificationExpiration(24);
      const now = new Date();
      expect(expiration.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should add correct number of hours', () => {
      const hours = 24;
      const expiration = getVerificationExpiration(hours);
      const now = new Date();
      const expectedTime = now.getTime() + hours * 60 * 60 * 1000;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(expiration.getTime() - expectedTime)).toBeLessThan(1000);
    });

    it('should handle different hour values', () => {
      const exp1 = getVerificationExpiration(1);
      const exp24 = getVerificationExpiration(24);
      const exp48 = getVerificationExpiration(48);

      expect(exp24.getTime()).toBeGreaterThan(exp1.getTime());
      expect(exp48.getTime()).toBeGreaterThan(exp24.getTime());
    });

    it('should return Date object', () => {
      const expiration = getVerificationExpiration(24);
      expect(expiration).toBeInstanceOf(Date);
    });
  });

  describe('isVerificationExpired', () => {
    it('is expired only after the expiration date', () => {
      const now = Date.now();

      expect(isVerificationExpired(new Date(now - 1000))).toBe(true);
      expect(isVerificationExpired(new Date(now + 60_000))).toBe(false);
    });
  });
});
