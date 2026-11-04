import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUserAction: vi.fn(),
  findUserById: vi.fn(),
  findRecentVerification: vi.fn(),
  deleteVerificationsForUser: vi.fn(),
  createEmailVerification: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock('@/lib/auth/require-action', () => ({
  requireUserAction: mocks.requireUserAction,
}));
vi.mock('@/lib/queries/users/find-user-by-id', () => ({
  findUserById: mocks.findUserById,
}));
vi.mock('@/lib/queries/email-verification/find-recent-verification', () => ({
  RATE_LIMIT_WINDOW_MS: 5 * 60 * 1000,
  findRecentVerification: mocks.findRecentVerification,
}));
vi.mock(
  '@/lib/mutations/email-verification/delete-verifications-for-user',
  () => ({ deleteVerificationsForUser: mocks.deleteVerificationsForUser })
);
vi.mock('@/lib/mutations/email-verification/create-verification', () => ({
  createEmailVerification: mocks.createEmailVerification,
}));
vi.mock('@/lib/email/email-service', () => ({
  getEmailService: () => ({
    sendVerificationEmail: mocks.sendVerificationEmail,
  }),
}));
vi.mock('@/lib/email/verification-utils', () => ({
  generateSecureToken: () => 'plain-token',
  hashToken: (token: string) => `hashed-${token}`,
  getVerificationExpiration: () => new Date('2025-01-02T12:00:00.000Z'),
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}));

import { resendVerificationAction } from '@/actions/account/verification';

const NOW = new Date('2025-01-01T12:00:00.000Z');
const user = {
  id: 'user-1',
  email: 'jan@example.com',
  name: 'Jan',
  emailVerified: false,
};

describe('resendVerificationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mocks.requireUserAction.mockResolvedValue({
      session: { user: { id: 'user-1' } },
    });
    mocks.findUserById.mockResolvedValue(user);
    mocks.findRecentVerification.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the denial for an anonymous caller', async () => {
    const denied = {
      ok: false,
      error: 'Wymagane logowanie',
      code: 'unauthenticated',
    };
    mocks.requireUserAction.mockResolvedValue({ denied });

    expect(await resendVerificationAction()).toEqual(denied);
    expect(mocks.findUserById).not.toHaveBeenCalled();
  });

  it('reports an unknown user', async () => {
    mocks.findUserById.mockResolvedValue(null);

    expect(await resendVerificationAction()).toMatchObject({
      ok: false,
      code: 'not-found',
    });
  });

  it('rejects an already verified email', async () => {
    mocks.findUserById.mockResolvedValue({ ...user, emailVerified: true });

    expect(await resendVerificationAction()).toEqual({
      ok: false,
      error: 'Email jest już zweryfikowany',
      code: 'invalid',
    });
  });

  it('rate limits with the remaining minutes', async () => {
    mocks.findRecentVerification.mockResolvedValue({
      createdAt: new Date('2025-01-01T11:58:30.000Z'),
    });

    expect(await resendVerificationAction()).toEqual({
      ok: false,
      error: 'Poczekaj 4 min przed ponownym wysłaniem',
      code: 'failed',
    });
    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('replaces old codes and emails a new token', async () => {
    expect(await resendVerificationAction()).toEqual({
      ok: true,
      data: { message: 'Email weryfikacyjny został wysłany ponownie' },
    });
    expect(mocks.deleteVerificationsForUser).toHaveBeenCalledWith('user-1');
    expect(mocks.createEmailVerification).toHaveBeenCalledWith({
      userId: 'user-1',
      hashedCode: 'hashed-plain-token',
      expiresAt: new Date('2025-01-02T12:00:00.000Z'),
    });
    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith(
      'jan@example.com',
      'plain-token',
      'Jan'
    );
  });

  it('omits a missing name from the email', async () => {
    mocks.findUserById.mockResolvedValue({ ...user, name: null });

    await resendVerificationAction();

    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith(
      'jan@example.com',
      'plain-token',
      undefined
    );
  });

  it('fails when sending fails', async () => {
    mocks.sendVerificationEmail.mockRejectedValue(new Error('smtp'));

    expect(await resendVerificationAction()).toEqual({
      ok: false,
      error: 'Nie udało się wysłać emaila',
      code: 'failed',
    });
  });
});
