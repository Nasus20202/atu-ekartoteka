import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hashToken } from '@/lib/auth/rules/verification-tokens';
import { verifyEmailToken } from '@/lib/auth/use-cases/verify-email-token';

const HOUR_MS = 60 * 60 * 1000;

const {
  mockLogger,
  mockFindVerificationByCode,
  mockVerifyEmailTransaction,
  mockRecordEmailVerification,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockFindVerificationByCode: vi.fn(),
  mockVerifyEmailTransaction: vi.fn(),
  mockRecordEmailVerification: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));
vi.mock('@/lib/auth/queries/find-verification-by-code', () => ({
  findVerificationByCode: mockFindVerificationByCode,
}));
vi.mock('@/lib/auth/mutations/verify-email-transaction', () => ({
  verifyEmailTransaction: mockVerifyEmailTransaction,
}));
vi.mock('@/lib/platform/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordEmailVerification: mockRecordEmailVerification },
}));

function makeVerification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'verification-id',
    userId: 'user-id',
    verified: false,
    expiresAt: new Date(Date.now() + HOUR_MS),
    user: { email: 'user@example.com', emailVerified: false },
    ...overrides,
  };
}

describe('verifyEmailToken', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFindVerificationByCode.mockResolvedValue(makeVerification());
    mockVerifyEmailTransaction.mockResolvedValue(true);
  });

  describe('token checks', () => {
    it('rejects an empty token without a lookup', async () => {
      const result = await verifyEmailToken('');

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Token weryfikacyjny jest wymagany',
      });
      expect(mockFindVerificationByCode).not.toHaveBeenCalled();
    });

    it('rejects a token that matches no verification', async () => {
      mockFindVerificationByCode.mockResolvedValue(null);

      const result = await verifyEmailToken('unknown-token');

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Nieprawidłowy token weryfikacyjny',
      });
      expect(mockFindVerificationByCode).toHaveBeenCalledWith(
        hashToken('unknown-token')
      );
      expect(mockVerifyEmailTransaction).not.toHaveBeenCalled();
      expect(mockRecordEmailVerification).not.toHaveBeenCalled();
    });

    it('logs an unknown token by length and hash fingerprint, never the token itself', async () => {
      mockFindVerificationByCode.mockResolvedValue(null);

      await verifyEmailToken('unknown-token');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        {
          tokenLength: 'unknown-token'.length,
          tokenFingerprint: hashToken('unknown-token').slice(0, 12),
        },
        'Invalid verification token'
      );
      expect(JSON.stringify(mockLogger.warn.mock.calls)).not.toContain(
        'unknown-token'
      );
    });

    it('rejects a token that was already used, without marking anything', async () => {
      mockFindVerificationByCode.mockResolvedValue(
        makeVerification({ verified: true })
      );

      const result = await verifyEmailToken('used-token');

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Ten token został już użyty',
      });
      expect(mockVerifyEmailTransaction).not.toHaveBeenCalled();
    });

    it('rejects an expired token and asks the user for a new link', async () => {
      mockFindVerificationByCode.mockResolvedValue(
        makeVerification({ expiresAt: new Date(Date.now() - 1000) })
      );

      const result = await verifyEmailToken('expired-token');

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Token weryfikacyjny wygasł. Poproś o nowy link.',
      });
      expect(mockVerifyEmailTransaction).not.toHaveBeenCalled();
      expect(mockRecordEmailVerification).not.toHaveBeenCalled();
    });
  });

  describe('successful verification', () => {
    it('marks the verification and the user as verified in one transaction call', async () => {
      const result = await verifyEmailToken('valid-token');

      expect(mockFindVerificationByCode).toHaveBeenCalledWith(
        hashToken('valid-token')
      );
      expect(mockVerifyEmailTransaction).toHaveBeenCalledWith(
        'user-id',
        'verification-id'
      );
      expect(result).toEqual({ ok: true, data: undefined });
    });

    it('records a successful email verification', async () => {
      await verifyEmailToken('valid-token');

      expect(mockRecordEmailVerification).toHaveBeenCalledWith('success');
    });
  });

  describe('concurrent consumption', () => {
    it('reports a token consumed by a concurrent request as already used', async () => {
      mockVerifyEmailTransaction.mockResolvedValue(false);

      const result = await verifyEmailToken('valid-token');

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Ten token został już użyty',
      });
      expect(mockRecordEmailVerification).not.toHaveBeenCalledWith('success');
    });
  });

  describe('unexpected errors', () => {
    it.each<[string, () => void]>([
      [
        'the verification lookup',
        () =>
          mockFindVerificationByCode.mockRejectedValue(new Error('DB down')),
      ],
      [
        'the verification transaction',
        () =>
          mockVerifyEmailTransaction.mockRejectedValue(new Error('DB down')),
      ],
    ])(
      'returns a generic failure, records it and logs the error when %s throws',
      async (_label, arrangeFailure) => {
        arrangeFailure();

        const result = await verifyEmailToken('valid-token');

        expect(result).toEqual({
          ok: false,
          code: 'failed',
          message: 'Nie udało się zweryfikować emaila',
        });
        expect(mockRecordEmailVerification).toHaveBeenCalledWith('failure');
        expect(mockLogger.error).toHaveBeenCalledWith(
          { error: expect.any(Error) },
          'Email verification error'
        );
      }
    );
  });
});
