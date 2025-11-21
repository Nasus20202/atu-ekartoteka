import { describe, expect, it } from 'vitest';

import {
  generateSecureToken,
  generateVerificationCode,
  getVerificationExpiration,
} from '@/lib/email/verification-utils';

describe('verification-utils', () => {
  describe('generateVerificationCode', () => {
    it('should generate code with correct length', () => {
      const code = generateVerificationCode();
      expect(code).toHaveLength(8);
    });

    it('should generate alphanumeric uppercase code', () => {
      const code = generateVerificationCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateVerificationCode());
      }
      // Should have at least 95 unique codes out of 100
      expect(codes.size).toBeGreaterThan(95);
    });

    it('should only contain alphanumeric characters', () => {
      // Generate many codes to test
      for (let i = 0; i < 100; i++) {
        const code = generateVerificationCode();
        // Should only contain A-Z and 0-9
        expect(code).toMatch(/^[A-Z0-9]+$/);
      }
    });
  });

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
});
