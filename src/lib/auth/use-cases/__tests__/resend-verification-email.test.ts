import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hashToken } from '@/lib/auth/rules/verification-tokens';
import { resendVerificationEmail } from '@/lib/auth/use-cases/resend-verification-email';

const NOW = new Date('2026-11-23T12:00:00Z');
const EXPIRES_AT = new Date('2026-11-24T12:00:00Z');
const MINUTE_MS = 60 * 1000;

const {
  mockLogger,
  mockFindUserById,
  mockFindRecentVerification,
  mockDeleteOtherVerifications,
  mockDeleteVerificationById,
  mockCreateEmailVerification,
  mockSendVerificationEmail,
  mockGetVerificationExpiration,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockFindUserById: vi.fn(),
  mockFindRecentVerification: vi.fn(),
  mockDeleteOtherVerifications: vi.fn(),
  mockDeleteVerificationById: vi.fn(),
  mockCreateEmailVerification: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
  mockGetVerificationExpiration: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));
vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: mockFindUserById,
}));
vi.mock('@/lib/auth/queries/find-recent-verification', () => ({
  findRecentVerification: mockFindRecentVerification,
  RATE_LIMIT_WINDOW_MS: 5 * 60 * 1000,
}));
vi.mock('@/lib/auth/mutations/delete-verification-codes', () => ({
  deleteOtherVerificationsForUser: mockDeleteOtherVerifications,
  deleteVerificationById: mockDeleteVerificationById,
}));
vi.mock('@/lib/auth/mutations/create-verification', () => ({
  createEmailVerification: mockCreateEmailVerification,
}));
vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({
    sendVerificationEmail: mockSendVerificationEmail,
  }),
}));
vi.mock('@/lib/auth/rules/verification-tokens', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/auth/rules/verification-tokens')
  >()),
  generateSecureToken: () => 'secure-token',
  getVerificationExpiration: mockGetVerificationExpiration,
}));

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    email: 'user@example.com',
    name: 'Test User',
    emailVerified: false,
    ...overrides,
  };
}

describe('resendVerificationEmail', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.resetAllMocks();
    mockFindUserById.mockResolvedValue(makeUser());
    mockFindRecentVerification.mockResolvedValue(null);
    mockDeleteOtherVerifications.mockResolvedValue(undefined);
    mockDeleteVerificationById.mockResolvedValue(undefined);
    mockCreateEmailVerification.mockResolvedValue({ id: 'new-code-id' });
    mockSendVerificationEmail.mockResolvedValue({ ok: true, delivery: 'sent' });
    mockGetVerificationExpiration.mockReturnValue(EXPIRES_AT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('account checks', () => {
    it('returns not-found when the user does not exist', async () => {
      mockFindUserById.mockResolvedValue(null);

      const result = await resendVerificationEmail('user-id');

      expect(result).toEqual({
        ok: false,
        code: 'not-found',
        message: 'Użytkownik nie znaleziony',
      });
      expect(mockFindRecentVerification).not.toHaveBeenCalled();
      expect(mockCreateEmailVerification).not.toHaveBeenCalled();
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });

    it('rejects a user whose email is already verified', async () => {
      mockFindUserById.mockResolvedValue(makeUser({ emailVerified: true }));

      const result = await resendVerificationEmail('user-id');

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Email jest już zweryfikowany',
      });
      expect(mockFindRecentVerification).not.toHaveBeenCalled();
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('rate limit', () => {
    it.each<[string, number, string]>([
      [
        'a code sent one minute ago',
        MINUTE_MS,
        'Poczekaj 4 min przed ponownym wysłaniem',
      ],
      [
        'a code sent 4.5 minutes ago rounds the wait up to 1 minute',
        4.5 * MINUTE_MS,
        'Poczekaj 1 min przed ponownym wysłaniem',
      ],
    ])('refuses to resend for %s', async (_label, elapsedMs, message) => {
      mockFindRecentVerification.mockResolvedValue({
        createdAt: new Date(NOW.getTime() - elapsedMs),
      });

      const result = await resendVerificationEmail('user-id');

      expect(result).toEqual({ ok: false, code: 'failed', message });
      expect(mockFindRecentVerification).toHaveBeenCalledWith('user-id');
      expect(mockDeleteOtherVerifications).not.toHaveBeenCalled();
      expect(mockCreateEmailVerification).not.toHaveBeenCalled();
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('successful resend', () => {
    it('replaces the stored code with a hashed one that expires at the configured time', async () => {
      await resendVerificationEmail('user-id');

      expect(mockCreateEmailVerification).toHaveBeenCalledWith({
        userId: 'user-id',
        hashedCode: hashToken('secure-token'),
        expiresAt: EXPIRES_AT,
      });
    });

    it('keeps the previous codes until the new one is delivered, then removes them', async () => {
      await resendVerificationEmail('user-id');

      expect(mockDeleteOtherVerifications).toHaveBeenCalledWith(
        'user-id',
        'new-code-id'
      );
      const createOrder =
        mockCreateEmailVerification.mock.invocationCallOrder[0];
      const sendOrder = mockSendVerificationEmail.mock.invocationCallOrder[0];
      const deleteOrder =
        mockDeleteOtherVerifications.mock.invocationCallOrder[0];
      expect(createOrder).toBeLessThan(sendOrder);
      expect(sendOrder).toBeLessThan(deleteOrder);
      expect(mockDeleteVerificationById).not.toHaveBeenCalled();
    });

    it('still succeeds and logs when removing the superseded codes fails', async () => {
      mockDeleteOtherVerifications.mockRejectedValueOnce(new Error('DB down'));

      const result = await resendVerificationEmail('user-id');

      expect(result.ok).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error), userId: 'user-id' },
        'Failed to remove superseded verification codes'
      );
    });

    it('emails the plain code to the stored address', async () => {
      await resendVerificationEmail('user-id');

      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        'secure-token',
        'Test User'
      );
    });

    it('uses the default verification expiry', async () => {
      await resendVerificationEmail('user-id');

      expect(mockGetVerificationExpiration).toHaveBeenCalledWith();
    });

    it('returns the confirmation message', async () => {
      const result = await resendVerificationEmail('user-id');

      expect(result).toEqual({
        ok: true,
        data: { message: 'Email weryfikacyjny został wysłany ponownie' },
      });
    });

    it('sends the email without a name when the account has none', async () => {
      mockFindUserById.mockResolvedValue(makeUser({ name: null }));

      await resendVerificationEmail('user-id');

      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        'secure-token',
        undefined
      );
    });
  });

  describe('unexpected errors', () => {
    it('still reports the send failure when removing the unsent code also fails', async () => {
      mockSendVerificationEmail.mockResolvedValueOnce({
        ok: false,
        reason: 'send-failed',
      });
      mockDeleteVerificationById.mockRejectedValueOnce(new Error('DB down'));

      const result = await resendVerificationEmail('user-id');

      expect(result).toEqual({
        ok: false,
        code: 'failed',
        message: 'Nie udało się wysłać emaila',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error), userId: 'user-id' },
        'Failed to remove unsent verification code'
      );
    });

    it('removes only the unsent code when the send fails, keeping the earlier delivered one', async () => {
      mockSendVerificationEmail.mockResolvedValueOnce({
        ok: false,
        reason: 'send-failed',
      });

      const result = await resendVerificationEmail('user-id');

      expect(result).toEqual({
        ok: false,
        code: 'failed',
        message: 'Nie udało się wysłać emaila',
      });
      expect(mockDeleteVerificationById).toHaveBeenCalledWith('new-code-id');
      expect(mockDeleteOtherVerifications).not.toHaveBeenCalled();
    });

    it.each<[string, () => void]>([
      [
        'the user lookup',
        () => mockFindUserById.mockRejectedValue(new Error('DB down')),
      ],
      [
        'the rate-limit lookup',
        () =>
          mockFindRecentVerification.mockRejectedValue(new Error('DB down')),
      ],
      [
        'storing the new code',
        () =>
          mockCreateEmailVerification.mockRejectedValue(new Error('DB down')),
      ],
    ])(
      'returns a generic failure and logs the error when %s throws',
      async (_label, arrangeFailure) => {
        arrangeFailure();

        const result = await resendVerificationEmail('user-id');

        expect(result).toEqual({
          ok: false,
          code: 'failed',
          message: 'Nie udało się wysłać emaila',
        });
        expect(mockLogger.error).toHaveBeenCalledWith(
          { error: expect.any(Error) },
          'Error resending verification email'
        );
      }
    );
  });
});
