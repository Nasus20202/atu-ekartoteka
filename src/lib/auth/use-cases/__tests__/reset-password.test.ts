import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import { AuthMethod } from '@/lib/auth/types/account';
import {
  type ResetPasswordRequest,
  resetPasswordWithToken,
} from '@/lib/auth/use-cases/reset-password';
import { hashToken } from '@/lib/auth/verification-tokens';

const ONE_HOUR_MS = 60 * 60 * 1000;

const {
  mockLogger,
  mockFindPasswordResetByToken,
  mockResetPasswordTransaction,
  mockVerifyTurnstileToken,
  mockRecordPasswordReset,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockFindPasswordResetByToken: vi.fn(),
  mockResetPasswordTransaction: vi.fn(),
  mockVerifyTurnstileToken: vi.fn(),
  mockRecordPasswordReset: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));
vi.mock('@/lib/auth/queries/find-password-reset-by-token', () => ({
  findPasswordResetByToken: mockFindPasswordResetByToken,
}));
vi.mock('@/lib/auth/mutations/reset-password-transaction', () => ({
  resetPasswordTransaction: mockResetPasswordTransaction,
}));
vi.mock('@/lib/auth/turnstile', () => ({
  verifyTurnstileToken: mockVerifyTurnstileToken,
}));
vi.mock('@/lib/platform/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordPasswordReset: mockRecordPasswordReset },
}));

const REQUEST: ResetPasswordRequest = {
  token: 'reset-token',
  password: 'password123',
  turnstileToken: null,
};

function makeResetToken(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reset-id',
    userId: 'user-id',
    expiresAt: new Date(Date.now() + ONE_HOUR_MS),
    used: false,
    user: { authMethod: AuthMethod.CREDENTIALS },
    ...overrides,
  };
}

describe('resetPasswordWithToken', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockVerifyTurnstileToken.mockResolvedValue(true);
    mockFindPasswordResetByToken.mockResolvedValue(makeResetToken());
    mockResetPasswordTransaction.mockResolvedValue(true);
  });

  describe('input validation', () => {
    it.each([
      ['a missing token', { token: '' }],
      ['a missing password', { password: '' }],
    ])(
      'rejects %s without checking Turnstile or the token',
      async (_label, overrides) => {
        const result = await resetPasswordWithToken({
          ...REQUEST,
          ...overrides,
        });

        expect(result).toEqual({
          ok: false,
          code: 'invalid',
          message: 'Token i hasło są wymagane',
        });
        expect(mockVerifyTurnstileToken).not.toHaveBeenCalled();
        expect(mockFindPasswordResetByToken).not.toHaveBeenCalled();
      }
    );

    it('rejects a password one character below the minimum', async () => {
      const result = await resetPasswordWithToken({
        ...REQUEST,
        password: 'a'.repeat(MIN_PASSWORD_LENGTH - 1),
      });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: PASSWORD_TOO_SHORT_MESSAGE,
      });
      expect(mockVerifyTurnstileToken).not.toHaveBeenCalled();
      expect(mockFindPasswordResetByToken).not.toHaveBeenCalled();
    });

    it('accepts a password of exactly the minimum length', async () => {
      const result = await resetPasswordWithToken({
        ...REQUEST,
        password: 'a'.repeat(MIN_PASSWORD_LENGTH),
      });

      expect(result).toEqual({ ok: true, data: undefined });
    });
  });

  describe('Turnstile', () => {
    it('rejects a failed Turnstile check before touching the token', async () => {
      mockVerifyTurnstileToken.mockResolvedValue(false);

      const result = await resetPasswordWithToken({
        ...REQUEST,
        turnstileToken: 'bad-token',
      });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Nieprawidłowe potwierdzenie turnstile',
      });
      expect(mockVerifyTurnstileToken).toHaveBeenCalledWith('bad-token');
      expect(mockFindPasswordResetByToken).not.toHaveBeenCalled();
      expect(mockResetPasswordTransaction).not.toHaveBeenCalled();
    });

    it('passes a missing Turnstile token to the verifier as undefined', async () => {
      mockVerifyTurnstileToken.mockResolvedValue(false);

      await resetPasswordWithToken(REQUEST);

      expect(mockVerifyTurnstileToken).toHaveBeenCalledWith(undefined);
    });
  });

  describe('token checks', () => {
    it('looks the token up by its hash, never by the plain value', async () => {
      await resetPasswordWithToken(REQUEST);

      expect(mockFindPasswordResetByToken).toHaveBeenCalledWith(
        hashToken('reset-token')
      );
      expect(mockFindPasswordResetByToken).not.toHaveBeenCalledWith(
        'reset-token'
      );
    });

    it('rejects a token that matches no reset request', async () => {
      mockFindPasswordResetByToken.mockResolvedValue(null);

      const result = await resetPasswordWithToken(REQUEST);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Nieprawidłowy lub wygasły token',
      });
      expect(mockResetPasswordTransaction).not.toHaveBeenCalled();
    });

    it('rejects an expired token without changing the password', async () => {
      mockFindPasswordResetByToken.mockResolvedValue(
        makeResetToken({ expiresAt: new Date(Date.now() - 1000) })
      );

      const result = await resetPasswordWithToken(REQUEST);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Token wygasł',
      });
      expect(mockResetPasswordTransaction).not.toHaveBeenCalled();
    });

    it('rejects a token that was already used', async () => {
      mockFindPasswordResetByToken.mockResolvedValue(
        makeResetToken({ used: true })
      );

      const result = await resetPasswordWithToken(REQUEST);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Token został już użyty',
      });
      expect(mockResetPasswordTransaction).not.toHaveBeenCalled();
    });

    it('refuses Google accounts, logs the user id and does not change the password', async () => {
      mockFindPasswordResetByToken.mockResolvedValue(
        makeResetToken({ user: { authMethod: AuthMethod.GOOGLE } })
      );

      const result = await resetPasswordWithToken(REQUEST);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message:
          'Konto Google nie może resetować hasła. Użyj logowania przez Google.',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: 'user-id' },
        'Password reset attempted for OAuth user'
      );
      expect(mockResetPasswordTransaction).not.toHaveBeenCalled();
    });
  });

  describe('successful reset', () => {
    it('sets the hashed password and consumes the token in one transaction call', async () => {
      const result = await resetPasswordWithToken(REQUEST);

      expect(mockResetPasswordTransaction).toHaveBeenCalledWith(
        'user-id',
        expect.any(String),
        'reset-id'
      );
      const [, hashedPassword] = mockResetPasswordTransaction.mock.calls[0] as [
        string,
        string,
      ];
      expect(hashedPassword).not.toBe('password123');
      await expect(bcrypt.compare('password123', hashedPassword)).resolves.toBe(
        true
      );
      expect(result).toEqual({ ok: true, data: undefined });
    });

    it('records a successful password reset', async () => {
      await resetPasswordWithToken(REQUEST);

      expect(mockRecordPasswordReset).toHaveBeenCalledWith('success');
    });

    it('keeps the plain token and password out of the logs', async () => {
      await resetPasswordWithToken(REQUEST);

      const logged = JSON.stringify([
        ...mockLogger.info.mock.calls,
        ...mockLogger.warn.mock.calls,
      ]);
      expect(logged).not.toContain('reset-token');
      expect(logged).not.toContain('password123');
    });
  });

  describe('concurrent consumption', () => {
    it('reports a token consumed by a concurrent request as already used', async () => {
      mockResetPasswordTransaction.mockResolvedValue(false);

      const result = await resetPasswordWithToken(REQUEST);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Token został już użyty',
      });
      expect(mockRecordPasswordReset).not.toHaveBeenCalledWith('success');
    });
  });

  describe('unexpected errors', () => {
    it.each<[string, () => void]>([
      [
        'the token lookup',
        () => mockFindPasswordResetByToken.mockRejectedValue(new Error('x')),
      ],
      [
        'the password transaction',
        () => mockResetPasswordTransaction.mockRejectedValue(new Error('x')),
      ],
    ])(
      'returns a generic failure and records it when %s throws',
      async (_label, arrangeFailure) => {
        arrangeFailure();

        const result = await resetPasswordWithToken(REQUEST);

        expect(result).toEqual({
          ok: false,
          code: 'failed',
          message: 'Nie udało się zresetować hasła',
        });
        expect(mockRecordPasswordReset).toHaveBeenCalledWith('failure');
        expect(mockLogger.error).toHaveBeenCalledWith(
          { error: expect.any(Error) },
          'Error resetting password'
        );
      }
    );
  });
});
