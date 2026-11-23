import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hashToken } from '@/lib/auth/rules/verification-tokens';
import { AuthMethod } from '@/lib/auth/types/account';
import {
  type PasswordResetRequest,
  requestPasswordReset,
} from '@/lib/auth/use-cases/request-password-reset';

const NOW = new Date('2026-11-23T12:00:00Z');
const ONE_HOUR_MS = 60 * 60 * 1000;

const {
  mockLogger,
  mockFindUserByEmail,
  mockCreatePasswordReset,
  mockDeletePasswordResetsForUser,
  mockVerifyTurnstileToken,
  mockSendPasswordResetEmail,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockFindUserByEmail: vi.fn(),
  mockCreatePasswordReset: vi.fn(),
  mockDeletePasswordResetsForUser: vi.fn(),
  mockVerifyTurnstileToken: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));
vi.mock('@/lib/users/queries/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));
vi.mock('@/lib/auth/mutations/create-password-reset', () => ({
  createPasswordReset: mockCreatePasswordReset,
}));
vi.mock('@/lib/auth/mutations/delete-password-resets-for-user', () => ({
  deletePasswordResetsForUser: mockDeletePasswordResetsForUser,
}));
vi.mock('@/lib/auth/gateways/turnstile', () => ({
  verifyTurnstileToken: mockVerifyTurnstileToken,
}));
vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({
    sendPasswordResetEmail: mockSendPasswordResetEmail,
  }),
}));
vi.mock('@/lib/auth/rules/verification-tokens', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/auth/rules/verification-tokens')
  >()),
  generateSecureToken: () => 'secure-token',
}));

const REQUEST: PasswordResetRequest = {
  email: 'test@example.com',
  turnstileToken: null,
};

const SUCCESS = { ok: true, data: undefined };

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    authMethod: AuthMethod.CREDENTIALS,
    ...overrides,
  };
}

describe('requestPasswordReset', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.resetAllMocks();
    mockVerifyTurnstileToken.mockResolvedValue(true);
    mockFindUserByEmail.mockResolvedValue(makeUser());
    mockDeletePasswordResetsForUser.mockResolvedValue(undefined);
    mockCreatePasswordReset.mockResolvedValue(undefined);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Turnstile', () => {
    it('rejects a failed Turnstile check before looking up the email', async () => {
      mockVerifyTurnstileToken.mockResolvedValue(false);

      const result = await requestPasswordReset({
        ...REQUEST,
        turnstileToken: 'bad-token',
      });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Nieprawidłowe potwierdzenie turnstile',
      });
      expect(mockVerifyTurnstileToken).toHaveBeenCalledWith('bad-token');
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('passes a missing Turnstile token to the verifier as undefined', async () => {
      mockVerifyTurnstileToken.mockResolvedValue(false);

      await requestPasswordReset(REQUEST);

      expect(mockVerifyTurnstileToken).toHaveBeenCalledWith(undefined);
    });
  });

  describe('input validation', () => {
    it('requires an email once the Turnstile check has passed', async () => {
      const result = await requestPasswordReset({ ...REQUEST, email: '' });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Email jest wymagany',
      });
      expect(mockVerifyTurnstileToken).toHaveBeenCalled();
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
    });
  });

  describe('accounts that cannot receive a reset', () => {
    it('reports success for an unknown email and does no work', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      const result = await requestPasswordReset(REQUEST);

      expect(result).toEqual(SUCCESS);
      expect(mockDeletePasswordResetsForUser).not.toHaveBeenCalled();
      expect(mockCreatePasswordReset).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('reports success for a Google account without issuing a token', async () => {
      mockFindUserByEmail.mockResolvedValue(
        makeUser({ authMethod: AuthMethod.GOOGLE })
      );

      const result = await requestPasswordReset(REQUEST);

      expect(result).toEqual(SUCCESS);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: 'user-id' },
        'Password reset requested for OAuth user'
      );
      expect(mockCreatePasswordReset).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('successful request', () => {
    it('looks the account up by the normalised email', async () => {
      await requestPasswordReset({ ...REQUEST, email: '  Test@Example.COM ' });

      expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('stores only the hash of a token that expires in one hour', async () => {
      await requestPasswordReset(REQUEST);

      expect(mockCreatePasswordReset).toHaveBeenCalledWith({
        userId: 'user-id',
        hashedToken: hashToken('secure-token'),
        expiresAt: new Date(NOW.getTime() + ONE_HOUR_MS),
      });
    });

    it('emails the plain token to the stored address', async () => {
      const result = await requestPasswordReset(REQUEST);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'secure-token',
        'Test User'
      );
      expect(result).toEqual(SUCCESS);
    });

    it('revokes older reset tokens before issuing a new one and emailing it', async () => {
      await requestPasswordReset(REQUEST);

      expect(mockDeletePasswordResetsForUser).toHaveBeenCalledWith('user-id');
      const deleteOrder =
        mockDeletePasswordResetsForUser.mock.invocationCallOrder[0];
      const createOrder = mockCreatePasswordReset.mock.invocationCallOrder[0];
      const sendOrder = mockSendPasswordResetEmail.mock.invocationCallOrder[0];
      expect(deleteOrder).toBeLessThan(createOrder);
      expect(createOrder).toBeLessThan(sendOrder);
    });

    it('sends the email without a name when the account has none', async () => {
      mockFindUserByEmail.mockResolvedValue(makeUser({ name: null }));

      await requestPasswordReset(REQUEST);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'secure-token',
        undefined
      );
    });

    it('keeps the email address and plain token out of the logs', async () => {
      await requestPasswordReset(REQUEST);

      const logged = JSON.stringify([
        ...mockLogger.info.mock.calls,
        ...mockLogger.warn.mock.calls,
      ]);
      expect(logged).not.toContain('test@example.com');
      expect(logged).not.toContain('secure-token');
    });
  });

  describe('unexpected errors', () => {
    it.each<[string, () => void]>([
      [
        'the user lookup',
        () => mockFindUserByEmail.mockRejectedValue(new Error('DB down')),
      ],
      [
        'clearing old tokens',
        () =>
          mockDeletePasswordResetsForUser.mockRejectedValue(
            new Error('DB down')
          ),
      ],
      [
        'storing the new token',
        () => mockCreatePasswordReset.mockRejectedValue(new Error('DB down')),
      ],
      [
        'sending the email',
        () =>
          mockSendPasswordResetEmail.mockRejectedValue(new Error('SMTP down')),
      ],
    ])(
      'returns a generic failure and logs the error when %s throws',
      async (_label, arrangeFailure) => {
        arrangeFailure();

        const result = await requestPasswordReset(REQUEST);

        expect(result).toEqual({
          ok: false,
          code: 'failed',
          message: 'Nie udało się przetworzyć żądania',
        });
        expect(mockLogger.error).toHaveBeenCalledWith(
          { error: expect.any(Error) },
          'Error processing password reset request'
        );
      }
    );
  });
});
