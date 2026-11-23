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
  mockSendVerificationEmail,
  mockNotifyAdminsOfNewUser,
  mockGetVerificationExpiration,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockCreateEmailVerification: vi.fn(),
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
    mockCreateEmailVerification.mockResolvedValue(undefined);
    mockSendVerificationEmail.mockResolvedValue(undefined);
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

  it.each([
    [
      'storing the code',
      () => mockCreateEmailVerification.mockRejectedValue(new Error('DB down')),
    ],
    [
      'sending the email',
      () => mockSendVerificationEmail.mockRejectedValue(new Error('SMTP down')),
    ],
  ])(
    'resolves without throwing and logs the error when %s fails',
    async (_label, arrangeFailure) => {
      arrangeFailure();

      await expect(sendRegistrationVerification(USER)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error), userId: 'user-id' },
        'Failed to send verification email'
      );
    }
  );
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
