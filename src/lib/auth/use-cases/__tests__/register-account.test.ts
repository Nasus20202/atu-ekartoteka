import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CREDENTIALS_REQUIRED_MESSAGE,
  EMAIL_TAKEN_MESSAGE,
  INVALID_EMAIL_MESSAGE,
} from '@/lib/auth/credential-validation';
import { PASSWORD_TOO_SHORT_MESSAGE } from '@/lib/auth/password-rules';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import {
  registerAccount,
  type RegisterAccountInput,
} from '@/lib/auth/use-cases/register-account';

const {
  mockLogger,
  mockFindUserByEmail,
  mockCreateFirstAdmin,
  mockCreateUser,
  mockSendRegistrationVerification,
  mockNotifyAdminsAboutRegistration,
  mockCreateRegistrationAutoLoginToken,
  mockIsTurnstileEnabled,
  mockVerifyTurnstileToken,
  mockRecordRegistration,
} = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockFindUserByEmail: vi.fn(),
  mockCreateFirstAdmin: vi.fn(),
  mockCreateUser: vi.fn(),
  mockSendRegistrationVerification: vi.fn(),
  mockNotifyAdminsAboutRegistration: vi.fn(),
  mockCreateRegistrationAutoLoginToken: vi.fn(),
  mockIsTurnstileEnabled: vi.fn(),
  mockVerifyTurnstileToken: vi.fn(),
  mockRecordRegistration: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));
vi.mock('@/lib/users/queries/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));
vi.mock('@/lib/users/mutations/create-first-admin', () => ({
  createFirstAdmin: mockCreateFirstAdmin,
}));
vi.mock('@/lib/users/mutations/create-user', () => ({
  createUser: mockCreateUser,
}));
vi.mock('@/lib/auth/use-cases/registration-notifications', () => ({
  sendRegistrationVerification: mockSendRegistrationVerification,
  notifyAdminsAboutRegistration: mockNotifyAdminsAboutRegistration,
}));
vi.mock('@/lib/auth/registration-auto-login-token', () => ({
  createRegistrationAutoLoginToken: mockCreateRegistrationAutoLoginToken,
}));
vi.mock('@/lib/auth/turnstile', () => ({
  isTurnstileEnabled: mockIsTurnstileEnabled,
  verifyTurnstileToken: mockVerifyTurnstileToken,
}));
vi.mock('@/lib/platform/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordRegistration: mockRecordRegistration },
}));

const TENANT_INPUT: RegisterAccountInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  isFirstAdmin: false,
  turnstileToken: null,
};

const FIRST_ADMIN_INPUT: RegisterAccountInput = {
  email: 'admin@example.com',
  password: 'adminpass123',
  name: 'Admin',
  isFirstAdmin: true,
  turnstileToken: null,
};

function makeRegisteredUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2026-11-23T10:00:00Z'),
    ...overrides,
  };
}

describe('registerAccount', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockIsTurnstileEnabled.mockReturnValue(false);
    mockVerifyTurnstileToken.mockResolvedValue(true);
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(makeRegisteredUser());
    mockCreateFirstAdmin.mockResolvedValue(
      makeRegisteredUser({ email: 'admin@example.com', name: 'Admin' })
    );
    mockCreateRegistrationAutoLoginToken.mockReturnValue('auto-login-token');
    mockSendRegistrationVerification.mockResolvedValue(undefined);
    mockNotifyAdminsAboutRegistration.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it.each<[string, Partial<RegisterAccountInput>, string]>([
      ['an empty email', { email: '' }, CREDENTIALS_REQUIRED_MESSAGE],
      ['an empty password', { password: '' }, CREDENTIALS_REQUIRED_MESSAGE],
      [
        'a whitespace-only email, which normalises to empty',
        { email: '   ' },
        CREDENTIALS_REQUIRED_MESSAGE,
      ],
      ['a malformed email', { email: 'notanemail' }, INVALID_EMAIL_MESSAGE],
      [
        'a password shorter than the minimum',
        { password: 'short' },
        PASSWORD_TOO_SHORT_MESSAGE,
      ],
    ])(
      'rejects %s without looking up or creating any account',
      async (_label, overrides, message) => {
        const result = await registerAccount({ ...TENANT_INPUT, ...overrides });

        expect(result).toEqual({ ok: false, code: 'invalid', message });
        expect(mockFindUserByEmail).not.toHaveBeenCalled();
        expect(mockCreateUser).not.toHaveBeenCalled();
        expect(mockCreateFirstAdmin).not.toHaveBeenCalled();
      }
    );

    it('checks the credentials before the Turnstile token', async () => {
      mockIsTurnstileEnabled.mockReturnValue(true);

      await registerAccount({ ...TENANT_INPUT, password: 'short' });

      expect(mockVerifyTurnstileToken).not.toHaveBeenCalled();
    });
  });

  describe('Turnstile', () => {
    it('rejects a failed Turnstile check before looking up the email', async () => {
      mockIsTurnstileEnabled.mockReturnValue(true);
      mockVerifyTurnstileToken.mockResolvedValue(false);

      const result = await registerAccount({
        ...TENANT_INPUT,
        turnstileToken: 'bad-token',
      });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Nieprawidłowe potwierdzenie turnstile',
      });
      expect(mockVerifyTurnstileToken).toHaveBeenCalledWith('bad-token');
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Registration failed: invalid Turnstile token'
      );
    });

    it('passes a missing Turnstile token to the verifier as undefined', async () => {
      mockIsTurnstileEnabled.mockReturnValue(true);
      mockVerifyTurnstileToken.mockResolvedValue(false);

      const result = await registerAccount(TENANT_INPUT);

      expect(mockVerifyTurnstileToken).toHaveBeenCalledWith(undefined);
      expect(result).toMatchObject({ ok: false, code: 'invalid' });
    });

    it('skips the Turnstile verifier when Turnstile is not configured', async () => {
      mockIsTurnstileEnabled.mockReturnValue(false);

      const result = await registerAccount(TENANT_INPUT);

      expect(mockVerifyTurnstileToken).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('existing accounts', () => {
    it('rejects an email that is already registered without creating a row', async () => {
      mockFindUserByEmail.mockResolvedValue(makeRegisteredUser());

      const result = await registerAccount(TENANT_INPUT);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: EMAIL_TAKEN_MESSAGE,
      });
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockCreateFirstAdmin).not.toHaveBeenCalled();
      expect(mockSendRegistrationVerification).not.toHaveBeenCalled();
    });
  });

  describe('tenant registration', () => {
    it('creates a pending, unverified tenant with a bcrypt-hashed password', async () => {
      await registerAccount(TENANT_INPUT);

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: false,
        })
      );
      const [args] = mockCreateUser.mock.calls[0] as [
        { hashedPassword: string },
      ];
      expect(args.hashedPassword).not.toBe('password123');
      await expect(
        bcrypt.compare('password123', args.hashedPassword)
      ).resolves.toBe(true);
    });

    it('returns an auto-login token and requires verification', async () => {
      const result = await registerAccount(TENANT_INPUT);

      expect(result).toEqual({
        ok: true,
        data: {
          autoLoginToken: 'auto-login-token',
          requiresVerification: true,
        },
      });
      expect(mockCreateRegistrationAutoLoginToken).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('sends the verification email and then notifies admins about the created user', async () => {
      await registerAccount(TENANT_INPUT);

      const createdUser = makeRegisteredUser();
      expect(mockSendRegistrationVerification).toHaveBeenCalledWith(
        createdUser
      );
      expect(mockNotifyAdminsAboutRegistration).toHaveBeenCalledWith(
        createdUser
      );
      expect(mockCreateUser.mock.invocationCallOrder[0]).toBeLessThan(
        mockSendRegistrationVerification.mock.invocationCallOrder[0]
      );
    });

    it('records a successful credentials registration', async () => {
      await registerAccount(TENANT_INPUT);

      expect(mockRecordRegistration).toHaveBeenCalledWith(
        'credentials',
        'success'
      );
    });

    it('normalises the email before the lookup and the insert', async () => {
      await registerAccount({ ...TENANT_INPUT, email: '  Test@Example.COM ' });

      expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      );
    });

    it('stores a blank name as null', async () => {
      await registerAccount({ ...TENANT_INPUT, name: '' });

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ name: null })
      );
    });

    it('returns a null auto-login token when no signing secret is configured', async () => {
      mockCreateRegistrationAutoLoginToken.mockReturnValue(null);

      const result = await registerAccount(TENANT_INPUT);

      expect(result).toEqual({
        ok: true,
        data: { autoLoginToken: null, requiresVerification: true },
      });
    });

    it('keeps the email address out of the logs', async () => {
      await registerAccount(TENANT_INPUT);

      const logged = JSON.stringify([
        ...mockLogger.info.mock.calls,
        ...mockLogger.warn.mock.calls,
      ]);
      expect(logged).not.toContain('test@example.com');
    });
  });

  describe('first admin bootstrap', () => {
    it('creates the first admin through the bootstrap path', async () => {
      const result = await registerAccount(FIRST_ADMIN_INPUT);

      expect(mockCreateFirstAdmin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        hashedPassword: expect.any(String),
        name: 'Admin',
      });
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        ok: true,
        data: {
          autoLoginToken: 'auto-login-token',
          requiresVerification: false,
        },
      });
    });

    it('skips the verification email and admin notice for the first admin', async () => {
      await registerAccount(FIRST_ADMIN_INPUT);

      expect(mockSendRegistrationVerification).not.toHaveBeenCalled();
      expect(mockNotifyAdminsAboutRegistration).not.toHaveBeenCalled();
    });

    it('rejects the bootstrap when an administrator already exists', async () => {
      mockCreateFirstAdmin.mockResolvedValue(null);

      const result = await registerAccount(FIRST_ADMIN_INPUT);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Administrator już istnieje w systemie',
      });
      expect(mockSendRegistrationVerification).not.toHaveBeenCalled();
    });
  });

  describe('concurrent registration', () => {
    it('returns an email-taken result when the insert loses a race', async () => {
      mockCreateUser.mockResolvedValue(null);

      const result = await registerAccount(TENANT_INPUT);

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: EMAIL_TAKEN_MESSAGE,
      });
      expect(mockSendRegistrationVerification).not.toHaveBeenCalled();
      expect(mockNotifyAdminsAboutRegistration).not.toHaveBeenCalled();
    });
  });

  describe('unexpected errors', () => {
    it.each<
      [string, { mock: ReturnType<typeof vi.fn>; input: RegisterAccountInput }]
    >([
      ['the email lookup', { mock: mockFindUserByEmail, input: TENANT_INPUT }],
      ['the tenant insert', { mock: mockCreateUser, input: TENANT_INPUT }],
      [
        'the first-admin insert',
        { mock: mockCreateFirstAdmin, input: FIRST_ADMIN_INPUT },
      ],
    ])(
      'returns a generic failure and logs the error when %s throws',
      async (_label, { mock, input }) => {
        const error = new Error('DB unavailable');
        mock.mockRejectedValue(error);

        const result = await registerAccount(input);

        expect(result).toEqual({
          ok: false,
          code: 'failed',
          message: 'Nie udało się utworzyć konta',
        });
        expect(mockLogger.error).toHaveBeenCalledWith(
          { error },
          'Registration error'
        );
        expect(mockRecordRegistration).toHaveBeenCalledWith(
          'credentials',
          'failure'
        );
        expect(mockSendRegistrationVerification).not.toHaveBeenCalled();
      }
    );
  });
});
