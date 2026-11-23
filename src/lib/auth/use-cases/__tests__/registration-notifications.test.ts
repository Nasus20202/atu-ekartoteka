import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hashToken } from '@/lib/auth/rules/verification-tokens';
import {
  notifyAdminsAboutRegistration,
  type RegisteredUser,
  sendRegistrationVerification,
} from '@/lib/auth/use-cases/registration-notifications';

const EXPIRES_AT = new Date('2026-11-24T12:00:00Z');

const {
  mockLogger,
  mockCreateEmailVerification,
  mockDeleteVerificationById,
  mockSendVerificationEmail,
  mockNotifyAdminsOfNewUser,
  mockGetVerificationExpiration,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockCreateEmailVerification: vi.fn(),
  mockDeleteVerificationById: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
  mockNotifyAdminsOfNewUser: vi.fn(),
  mockGetVerificationExpiration: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));
vi.mock('@/lib/auth/mutations/create-verification', () => ({
  createEmailVerification: mockCreateEmailVerification,
}));
vi.mock('@/lib/auth/mutations/delete-verification-codes', () => ({
  deleteVerificationById: mockDeleteVerificationById,
}));
vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({
    sendVerificationEmail: mockSendVerificationEmail,
  }),
}));
vi.mock('@/lib/auth/use-cases/new-user-registration', () => ({
  notifyAdminsOfNewUser: mockNotifyAdminsOfNewUser,
}));
vi.mock('@/lib/auth/rules/verification-tokens', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/auth/rules/verification-tokens')
  >()),
  generateSecureToken: () => 'secure-token',
  getVerificationExpiration: mockGetVerificationExpiration,
}));

const USER: RegisteredUser = {
  id: 'user-id',
  email: 'new@example.com',
  name: 'New User',
  createdAt: new Date('2026-11-23T10:00:00Z'),
};

describe('sendRegistrationVerification', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCreateEmailVerification.mockResolvedValue({ id: 'code-id' });
    mockDeleteVerificationById.mockResolvedValue(undefined);
    mockSendVerificationEmail.mockResolvedValue({ ok: true, delivery: 'sent' });
    mockGetVerificationExpiration.mockReturnValue(EXPIRES_AT);
  });

  it('stores a hashed code that expires in 24 hours', async () => {
    await sendRegistrationVerification(USER);

    expect(mockGetVerificationExpiration).toHaveBeenCalledWith(24);
    expect(mockCreateEmailVerification).toHaveBeenCalledWith({
      userId: 'user-id',
      hashedCode: hashToken('secure-token'),
      expiresAt: EXPIRES_AT,
    });
  });

  it('emails the plain code to the new user', async () => {
    await sendRegistrationVerification(USER);

    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      'new@example.com',
      'secure-token',
      'New User'
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('stores the code before emailing it', async () => {
    await sendRegistrationVerification(USER);

    expect(
      mockCreateEmailVerification.mock.invocationCallOrder[0]
    ).toBeLessThan(mockSendVerificationEmail.mock.invocationCallOrder[0]);
  });

  it('sends the email without a name when the user has none', async () => {
    await sendRegistrationVerification({ ...USER, name: null });

    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      'new@example.com',
      'secure-token',
      undefined
    );
  });

  it('resolves without throwing and logs the error when storing the code fails', async () => {
    mockCreateEmailVerification.mockRejectedValue(new Error('DB down'));

    await expect(sendRegistrationVerification(USER)).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      { error: expect.any(Error), userId: 'user-id' },
      'Failed to send verification email'
    );
  });

  it('resolves without throwing and logs the reason when the email is not sent', async () => {
    mockSendVerificationEmail.mockResolvedValue({
      ok: false,
      reason: 'send-failed',
    });

    await expect(sendRegistrationVerification(USER)).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      { userId: 'user-id', reason: 'send-failed' },
      'Failed to send verification email'
    );
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      { userId: 'user-id' },
      'Verification email sent'
    );
    expect(mockDeleteVerificationById).toHaveBeenCalledWith('code-id');
  });

  it('keeps the stored code when the email is sent', async () => {
    await sendRegistrationVerification(USER);

    expect(mockDeleteVerificationById).not.toHaveBeenCalled();
  });
});

describe('notifyAdminsAboutRegistration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNotifyAdminsOfNewUser.mockResolvedValue(undefined);
  });

  it('passes the new user email, name and registration date to the admin notifier', async () => {
    await notifyAdminsAboutRegistration(USER);

    expect(mockNotifyAdminsOfNewUser).toHaveBeenCalledWith(
      'new@example.com',
      'New User',
      USER.createdAt
    );
  });

  it.each([
    ['a null name', null],
    ['an empty name', ''],
  ])('labels the new user as "Brak imienia" for %s', async (_label, name) => {
    await notifyAdminsAboutRegistration({ ...USER, name });

    expect(mockNotifyAdminsOfNewUser).toHaveBeenCalledWith(
      'new@example.com',
      'Brak imienia',
      USER.createdAt
    );
  });

  it('resolves without throwing and logs the error when the admin notifier fails', async () => {
    mockNotifyAdminsOfNewUser.mockRejectedValue(new Error('SMTP down'));

    await expect(notifyAdminsAboutRegistration(USER)).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      { error: expect.any(Error), userId: 'user-id' },
      'Failed to notify admins of new user'
    );
  });
});
