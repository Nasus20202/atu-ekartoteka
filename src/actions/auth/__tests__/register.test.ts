import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerAction, type RegisterInput } from '@/actions/auth/register';
import { AccountStatus, UserRole } from '@/lib/types';

const {
  mockFindUserByEmail,
  mockCreateFirstAdmin,
  mockCreateUser,
  mockCreateEmailVerification,
  mockSendVerificationEmail,
  mockNotifyAdminsOfNewUser,
  mockCreateRegistrationAutoLoginToken,
  mockRecordRegistration,
  mockIsTurnstileEnabled,
  mockVerifyTurnstileToken,
} = vi.hoisted(() => ({
  mockFindUserByEmail: vi.fn(),
  mockCreateFirstAdmin: vi.fn(),
  mockCreateUser: vi.fn(),
  mockCreateEmailVerification: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
  mockNotifyAdminsOfNewUser: vi.fn(),
  mockCreateRegistrationAutoLoginToken: vi.fn(),
  mockRecordRegistration: vi.fn(),
  mockIsTurnstileEnabled: vi.fn(),
  mockVerifyTurnstileToken: vi.fn(),
}));

vi.mock('@/lib/queries/users/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));
vi.mock('@/lib/mutations/users/create-first-admin', () => ({
  createFirstAdmin: mockCreateFirstAdmin,
}));
vi.mock('@/lib/mutations/users/create-user', () => ({
  createUser: mockCreateUser,
}));
vi.mock('@/lib/mutations/email-verification/create-verification', () => ({
  createEmailVerification: mockCreateEmailVerification,
}));
vi.mock('@/lib/email/email-service', () => ({
  getEmailService: () => ({
    sendVerificationEmail: mockSendVerificationEmail,
  }),
}));
vi.mock('@/lib/notifications/new-user-registration', () => ({
  notifyAdminsOfNewUser: mockNotifyAdminsOfNewUser,
}));
vi.mock('@/lib/auth/registration-auto-login-token', () => ({
  createRegistrationAutoLoginToken: mockCreateRegistrationAutoLoginToken,
}));
vi.mock('@/lib/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordRegistration: mockRecordRegistration },
}));
vi.mock('@/lib/turnstile', () => ({
  isTurnstileEnabled: mockIsTurnstileEnabled,
  verifyTurnstileToken: mockVerifyTurnstileToken,
}));
vi.mock('@/lib/email/verification-utils', () => ({
  generateSecureToken: () => 'secure-token',
  getVerificationExpiration: () => new Date(Date.now() + 86400_000),
  hashToken: (t: string) => `hashed-${t}`,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

const TENANT_INPUT: RegisterInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  isFirstAdmin: false,
  turnstileToken: null,
};

/** Builds an input that may be missing fields, as a bad client could send. */
function withInput(overrides: Record<string, unknown>): RegisterInput {
  return { ...TENANT_INPUT, ...overrides } as unknown as RegisterInput;
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.TENANT,
    status: AccountStatus.PENDING,
    emailVerified: false,
    createdAt: new Date(),
    ...overrides,
  };
}

function mockSuccessfulTenant(user = makeUser()) {
  mockFindUserByEmail.mockResolvedValue(null);
  mockCreateUser.mockResolvedValue(user);
  mockCreateEmailVerification.mockResolvedValue({});
  mockSendVerificationEmail.mockResolvedValue(undefined);
  mockNotifyAdminsOfNewUser.mockResolvedValue(undefined);
}

describe('registerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRegistrationAutoLoginToken.mockReturnValue('mock-token');
    mockIsTurnstileEnabled.mockReturnValue(false);
  });

  it.each([
    ['a missing email', { email: '' }, /email/i],
    ['a missing password', { password: '' }, /hasło|email/i],
    ['an invalid email format', { email: 'notanemail' }, /email/i],
    ['a password that is too short', { password: 'short' }, /hasło/i],
  ])(
    'rejects %s without touching the database',
    async (_label, overrides, message) => {
      const result = await registerAction(withInput(overrides));

      expect(result).toEqual(
        expect.objectContaining({ ok: false, code: 'invalid' })
      );
      expect(result).toMatchObject({ error: expect.stringMatching(message) });
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
    }
  );

  it('rejects an email that is already registered', async () => {
    mockFindUserByEmail.mockResolvedValue(makeUser());

    const result = await registerAction(TENANT_INPUT);

    expect(result).toMatchObject({
      ok: false,
      code: 'invalid',
      error: expect.stringMatching(/już istnieje/i),
    });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('registers a tenant, sends a verification email and notifies admins', async () => {
    mockSuccessfulTenant();

    const result = await registerAction(TENANT_INPUT);

    expect(result).toEqual({
      ok: true,
      data: { autoLoginToken: 'mock-token', requiresVerification: true },
    });
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'secure-token',
      'Test User'
    );
    expect(mockNotifyAdminsOfNewUser).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      expect.any(Date)
    );
    expect(mockRecordRegistration).toHaveBeenCalledWith(
      'credentials',
      'success'
    );
  });

  it('does not return the stored user record', async () => {
    mockSuccessfulTenant();

    const result = await registerAction(TENANT_INPUT);

    expect(result.ok && 'user' in result.data).toBe(false);
  });

  it('normalises the email before looking it up and storing it', async () => {
    mockSuccessfulTenant();

    await registerAction(withInput({ email: '  Test@Example.COM ' }));

    expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    );
  });

  it('registers the first admin as approved, without email or notification', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateFirstAdmin.mockResolvedValue(
      makeUser({
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
      })
    );

    const result = await registerAction(
      withInput({
        email: 'admin@example.com',
        password: 'adminpass123',
        isFirstAdmin: true,
      })
    );

    expect(result).toEqual({
      ok: true,
      data: { autoLoginToken: 'mock-token', requiresVerification: false },
    });
    expect(mockCreateFirstAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@example.com' })
    );
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    expect(mockNotifyAdminsOfNewUser).not.toHaveBeenCalled();
  });

  it('rejects the first-admin bootstrap when an admin already exists', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateFirstAdmin.mockResolvedValue(null);

    const result = await registerAction(
      withInput({ email: 'admin2@example.com', isFirstAdmin: true })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'invalid',
      error: expect.stringMatching(/administrator już istnieje/i),
    });
  });

  it('returns a validation failure instead of a crash when the email is taken concurrently', async () => {
    const { Prisma } = await import('@/generated/prisma/client');
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique violation', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    const result = await registerAction(TENANT_INPUT);

    expect(result).toMatchObject({
      ok: false,
      code: 'invalid',
      error: expect.stringMatching(/już istnieje/i),
    });
  });

  it('still succeeds when the verification email fails to send', async () => {
    mockSuccessfulTenant();
    mockSendVerificationEmail.mockRejectedValue(new Error('SMTP error'));

    const result = await registerAction(TENANT_INPUT);

    expect(result.ok).toBe(true);
  });

  it('still succeeds when the admin notification fails', async () => {
    mockSuccessfulTenant();
    mockNotifyAdminsOfNewUser.mockRejectedValueOnce(
      new Error('Notification error')
    );

    const result = await registerAction(TENANT_INPUT);

    expect(result.ok).toBe(true);
  });

  it('uses "Brak imienia" in the admin notice when no name is given', async () => {
    mockSuccessfulTenant(makeUser({ name: null }));

    await registerAction(withInput({ name: undefined }));

    expect(mockNotifyAdminsOfNewUser).toHaveBeenCalledWith(
      'test@example.com',
      'Brak imienia',
      expect.any(Date)
    );
  });

  it('returns a generic failure and records it on an unexpected error', async () => {
    mockFindUserByEmail.mockRejectedValue(new Error('DB connection failed'));

    const result = await registerAction(TENANT_INPUT);

    expect(result).toMatchObject({
      ok: false,
      code: 'failed',
      error: expect.stringMatching(/nie udało się/i),
    });
    expect(mockRecordRegistration).toHaveBeenCalledWith(
      'credentials',
      'failure'
    );
  });

  it('rejects a failed Turnstile check without creating the account', async () => {
    mockIsTurnstileEnabled.mockReturnValue(true);
    mockVerifyTurnstileToken.mockResolvedValue(false);

    const result = await registerAction(
      withInput({ turnstileToken: 'bad-token' })
    );

    expect(result).toMatchObject({ ok: false, code: 'invalid' });
    expect(mockVerifyTurnstileToken).toHaveBeenCalledWith('bad-token');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('registers when Turnstile is enabled and the token is valid', async () => {
    mockIsTurnstileEnabled.mockReturnValue(true);
    mockVerifyTurnstileToken.mockResolvedValue(true);
    mockSuccessfulTenant(makeUser({ name: null }));

    const result = await registerAction(
      withInput({ name: undefined, turnstileToken: 'good-token' })
    );

    expect(result.ok).toBe(true);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'secure-token',
      undefined
    );
  });
});
