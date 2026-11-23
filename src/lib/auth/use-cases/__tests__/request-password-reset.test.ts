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
  mockReplacePasswordReset,
  mockVerifyTurnstileToken,
  mockSendPasswordResetEmail,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockFindUserByEmail: vi.fn(),
  mockReplacePasswordReset: vi.fn(),
  mockVerifyTurnstileToken: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));
vi.mock('@/lib/users/queries/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));
vi.mock('@/lib/auth/mutations/replace-password-reset', () => ({
  replacePasswordReset: mockReplacePasswordReset,
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

let deferred: Array<() => Promise<void>> = [];

const afterResponse = (task: () => Promise<void>) => {
  deferred.push(task);
};

/** Runs the use case, then the work it scheduled for after the response. */
async function run(request: PasswordResetRequest) {
  const result = await requestPasswordReset(request, afterResponse);
  await Promise.all(deferred.map((task) => task()));
  return result;
}

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
    deferred = [];
    mockVerifyTurnstileToken.mockResolvedValue(true);
    mockFindUserByEmail.mockResolvedValue(makeUser());
    mockReplacePasswordReset.mockResolvedValue(undefined);
    mockSendPasswordResetEmail.mockResolvedValue({
      ok: true,
      delivery: 'sent',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Turnstile', () => {
    it('rejects a failed Turnstile check before looking up the email', async () => {
      mockVerifyTurnstileToken.mockResolvedValue(false);

      const result = await run({
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

      await run(REQUEST);

      expect(mockVerifyTurnstileToken).toHaveBeenCalledWith(undefined);
    });
  });

  describe('input validation', () => {
    it('requires an email once the Turnstile check has passed', async () => {
      const result = await run({ ...REQUEST, email: '' });

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

      const result = await run(REQUEST);

      expect(result).toEqual(SUCCESS);
      expect(mockReplacePasswordReset).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('reports success for a Google account without issuing a token', async () => {
      mockFindUserByEmail.mockResolvedValue(
        makeUser({ authMethod: AuthMethod.GOOGLE })
      );

      const result = await run(REQUEST);

      expect(result).toEqual(SUCCESS);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: 'user-id' },
        'Password reset requested for OAuth user'
      );
      expect(mockReplacePasswordReset).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('successful request', () => {
    it('looks the account up by the normalised email', async () => {
      await run({ ...REQUEST, email: '  Test@Example.COM ' });

      expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('stores only the hash of a token that expires in one hour', async () => {
      await run(REQUEST);

      expect(mockReplacePasswordReset).toHaveBeenCalledWith({
        userId: 'user-id',
        hashedToken: hashToken('secure-token'),
        expiresAt: new Date(NOW.getTime() + ONE_HOUR_MS),
      });
    });

    it('emails the plain token to the stored address', async () => {
      const result = await run(REQUEST);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'secure-token',
        'Test User'
      );
      expect(result).toEqual(SUCCESS);
    });

    it('stores the new token before emailing it', async () => {
      await run(REQUEST);

      const storeOrder = mockReplacePasswordReset.mock.invocationCallOrder[0];
      const sendOrder = mockSendPasswordResetEmail.mock.invocationCallOrder[0];
      expect(storeOrder).toBeLessThan(sendOrder);
    });

    it('sends the email without a name when the account has none', async () => {
      mockFindUserByEmail.mockResolvedValue(makeUser({ name: null }));

      await run(REQUEST);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'secure-token',
        undefined
      );
    });

    it('keeps the email address and plain token out of the logs', async () => {
      await run(REQUEST);

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
        'storing the new token',
        () => mockReplacePasswordReset.mockRejectedValue(new Error('DB down')),
      ],
    ])(
      'returns a generic failure and logs the error when %s throws',
      async (_label, arrangeFailure) => {
        arrangeFailure();

        const result = await run(REQUEST);

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
  describe('email delivery', () => {
    it('schedules the email instead of sending it before the response', async () => {
      const result = await requestPasswordReset(REQUEST, afterResponse);

      expect(result).toEqual(SUCCESS);
      expect(deferred).toHaveLength(1);
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('schedules nothing for an unknown email', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      await requestPasswordReset(REQUEST, afterResponse);

      expect(deferred).toHaveLength(0);
    });

    it('logs the email as sent once the send resolves', async () => {
      await run(REQUEST);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { userId: 'user-id' },
        'Password reset email sent'
      );
    });

    it('logs a send the service reports as failed', async () => {
      mockSendPasswordResetEmail.mockResolvedValue({
        ok: false,
        reason: 'send-failed',
      });

      await run(REQUEST);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { userId: 'user-id', reason: 'send-failed' },
        'Password reset email failed'
      );
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        { userId: 'user-id' },
        'Password reset email sent'
      );
    });

    it('logs a failed send without throwing from the scheduled task', async () => {
      mockSendPasswordResetEmail.mockRejectedValue(new Error('SMTP down'));

      const result = await run(REQUEST);

      expect(result).toEqual(SUCCESS);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error), userId: 'user-id' },
        'Password reset email failed'
      );
    });
  });
});
