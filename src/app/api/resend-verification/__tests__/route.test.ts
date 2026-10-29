import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUserById: vi.fn(),
  findRecentVerification: vi.fn(),
  deleteVerificationsForUser: vi.fn(),
  createEmailVerification: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/queries/users/find-user-by-id', () => ({
  findUserById: mocks.findUserById,
}));
vi.mock('@/lib/queries/email-verification/find-recent-verification', () => ({
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

import { POST } from '@/app/api/resend-verification/route';

const NOW = new Date('2025-01-01T12:00:00.000Z');
const user = {
  id: 'user-1',
  email: 'jan@example.com',
  name: 'Jan',
  emailVerified: false,
};

describe('POST /api/resend-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.findUserById.mockResolvedValue(user);
    mocks.findRecentVerification.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires a session', async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
  });

  it('returns 404 for an unknown user', async () => {
    mocks.findUserById.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(404);
  });

  it('rejects an already verified email', async () => {
    mocks.findUserById.mockResolvedValue({ ...user, emailVerified: true });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Email jest już zweryfikowany',
    });
  });

  it('rate limits with the remaining minutes', async () => {
    mocks.findRecentVerification.mockResolvedValue({
      createdAt: new Date('2025-01-01T11:58:30.000Z'),
    });

    const response = await POST();

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: 'Poczekaj 4 min przed ponownym wysłaniem',
    });
    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('replaces old codes and emails a new token', async () => {
    const response = await POST();

    expect(response.status).toBe(200);
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

    await POST();

    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith(
      'jan@example.com',
      'plain-token',
      undefined
    );
  });

  it('returns 500 when sending fails', async () => {
    mocks.sendVerificationEmail.mockRejectedValue(new Error('smtp'));

    const response = await POST();

    expect(response.status).toBe(500);
  });
});
