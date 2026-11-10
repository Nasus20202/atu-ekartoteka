import bcrypt from 'bcrypt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockUser, mockUsers } from '@/__tests__/fixtures';
import { buildProviders, credentialsAuthorize } from '@/lib/auth/providers';
import { expectNoPersonalData } from '@/lib/logging/testing';

const { mockFindUserByEmail, mockVerifyToken, mockLog } = vi.hoisted(() => ({
  mockFindUserByEmail: vi.fn(),
  mockVerifyToken: vi.fn(),
  mockLog: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/queries/users/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));

vi.mock('@/lib/auth/registration-auto-login-token', () => ({
  verifyRegistrationAutoLoginToken: mockVerifyToken,
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('@/lib/turnstile', () => ({
  isTurnstileEnabled: vi.fn(() => false),
  verifyTurnstileToken: vi.fn(),
}));

vi.mock('@/lib/opentelemetry/auth-metrics', () => ({
  authMetrics: {
    recordLogin: vi.fn(),
    recordRegistration: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => mockLog,
}));

async function mockTurnstile(enabled: boolean, valid = true) {
  const { isTurnstileEnabled, verifyTurnstileToken } =
    await import('@/lib/turnstile');
  vi.mocked(isTurnstileEnabled).mockReturnValue(enabled);
  vi.mocked(verifyTurnstileToken).mockResolvedValue(valid as never);
}

describe('credentialsAuthorize', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await mockTurnstile(false);
    mockVerifyToken.mockReturnValue(false);
    vi.mocked(bcrypt.hash).mockResolvedValue('dummy-hash' as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
  });

  describe('input validation', () => {
    it('returns null when email is missing', async () => {
      expect(
        await credentialsAuthorize({ email: '', password: 'pw' })
      ).toBeNull();
    });

    it('returns null when password is missing', async () => {
      expect(
        await credentialsAuthorize({ email: 'test@example.com', password: '' })
      ).toBeNull();
    });

    it('returns null when credentials are undefined', async () => {
      expect(await credentialsAuthorize(undefined)).toBeNull();
    });

    it('looks the user up by the normalised email', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUsers.tenant);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await credentialsAuthorize({
        email: '  Test@Example.COM ',
        password: 'correct',
      });

      expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('turnstile bypass for registration auto-login', () => {
    it('allows login with a valid auto-login grant without Turnstile', async () => {
      const { verifyTurnstileToken } = await import('@/lib/turnstile');
      await mockTurnstile(true);
      mockVerifyToken.mockReturnValue(true);
      mockFindUserByEmail.mockResolvedValue(mockUsers.tenant);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
        autoLoginBypassToken: 'valid-bypass',
      });

      expect(result).not.toBeNull();
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
      expect(mockVerifyToken).toHaveBeenCalledWith(
        'valid-bypass',
        'test@example.com'
      );
    });

    it('still requires the correct password with a valid grant', async () => {
      await mockTurnstile(true);
      mockVerifyToken.mockReturnValue(true);
      mockFindUserByEmail.mockResolvedValue(mockUsers.tenant);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'wrong',
        autoLoginBypassToken: 'valid-bypass',
      });

      expect(result).toBeNull();
    });

    it('uses Turnstile validation when the grant is invalid', async () => {
      const { verifyTurnstileToken } = await import('@/lib/turnstile');
      await mockTurnstile(true, true);
      mockFindUserByEmail.mockResolvedValue(mockUsers.tenant);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
        autoLoginBypassToken: 'invalid-bypass',
        turnstileToken: 'turnstile-token',
      });

      expect(result).not.toBeNull();
      expect(verifyTurnstileToken).toHaveBeenCalledWith('turnstile-token');
    });

    it.each([
      ['missing', undefined, 'missing_turnstile'],
      ['invalid', 'bad-token', 'invalid_turnstile'],
    ])('rejects a %s Turnstile token', async (_, turnstileToken, reason) => {
      const { authMetrics } = await import('@/lib/opentelemetry/auth-metrics');
      await mockTurnstile(true, false);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
        turnstileToken,
      });

      expect(result).toBeNull();
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
      expect(authMetrics.recordLogin).toHaveBeenCalledWith(
        'credentials',
        'failure',
        reason
      );
    });
  });

  describe('user lookup', () => {
    it('returns null when the user does not exist and still spends bcrypt work', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      const result = await credentialsAuthorize({
        email: 'nonexistent@example.com',
        password: 'pw',
      });

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('pw', 'dummy-hash');
      expectNoPersonalData(Object.values(mockLog), ['nonexistent@example.com']);
    });

    it('logs no e-mail address for an existing account either', async () => {
      mockFindUserByEmail.mockResolvedValue(createMockUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await credentialsAuthorize({ email: 'test@example.com', password: 'pw' });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      await credentialsAuthorize({ email: 'test@example.com', password: 'pw' });

      expect(mockLog.warn).toHaveBeenCalledWith(
        { userId: expect.any(String) },
        'Failed login attempt: incorrect password'
      );
      expectNoPersonalData(Object.values(mockLog), ['test@example.com']);
    });

    it('returns null when a Google-only user has no password', async () => {
      mockFindUserByEmail.mockResolvedValue(
        createMockUser({ password: null } as never)
      );

      expect(
        await credentialsAuthorize({
          email: 'test@example.com',
          password: 'pw',
        })
      ).toBeNull();
    });
  });

  describe('password verification', () => {
    it('returns null when the password does not match', async () => {
      mockFindUserByEmail.mockResolvedValue(createMockUser());

      expect(
        await credentialsAuthorize({
          email: 'test@example.com',
          password: 'wrong',
        })
      ).toBeNull();
    });

    it('returns the session fields when the password matches', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUsers.tenant);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
      });

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        mustChangePassword: false,
      });
      expect(result).not.toHaveProperty('role');
    });

    it('includes mustChangePassword: true for bulk-created users', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUsers.mustChangePassword);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'mcp@example.com',
        password: 'correct',
      });

      expect(result).toMatchObject({ mustChangePassword: true });
    });

    it('handles a user with a null name', async () => {
      mockFindUserByEmail.mockResolvedValue(createMockUser({ name: null }));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
      });

      expect(result).toMatchObject({ name: null });
    });
  });

  describe('error handling', () => {
    it('propagates database errors', async () => {
      mockFindUserByEmail.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(
        credentialsAuthorize({ email: 'test@example.com', password: 'pw' })
      ).rejects.toThrow('Database connection error');
    });

    it('propagates bcrypt errors', async () => {
      mockFindUserByEmail.mockResolvedValue(createMockUser());
      vi.mocked(bcrypt.compare).mockRejectedValue(
        new Error('Bcrypt error') as never
      );

      await expect(
        credentialsAuthorize({ email: 'test@example.com', password: 'pw' })
      ).rejects.toThrow('Bcrypt error');
    });
  });
});

describe('buildProviders', () => {
  it('excludes Google provider when env vars are not set', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const ids = buildProviders().map((p) => (p as { id?: string }).id);

    expect(ids).not.toContain('google');
    expect(ids).toContain('credentials');
  });

  it('includes Google provider when env vars are set', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

    const ids = buildProviders().map((p) => (p as { id?: string }).id);

    expect(ids).toContain('google');
    expect(ids).toContain('credentials');

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });
});

describe('Google issuer override', () => {
  const GOOGLE_ISSUER = 'https://accounts.google.com';
  const MOCK_ISSUER = 'http://localhost:4010/google';

  async function loadGoogleProvider() {
    vi.resetModules();
    process.env.GOOGLE_CLIENT_ID = 'id';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    const { buildProviders: build } = await import('@/lib/auth/providers');
    return build().find((p) => (p as { id?: string }).id === 'google') as {
      issuer: string;
      options: { issuer?: string };
    };
  }

  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_ISSUER_URL;
  });

  it('keeps Google as the issuer by default', async () => {
    const provider = await loadGoogleProvider();

    expect(provider.issuer).toBe(GOOGLE_ISSUER);
    expect(provider.options.issuer).toBeUndefined();
  });

  it('uses GOOGLE_ISSUER_URL when it is set', async () => {
    process.env.GOOGLE_ISSUER_URL = MOCK_ISSUER;

    const provider = await loadGoogleProvider();

    expect(provider.options.issuer).toBe(MOCK_ISSUER);
  });
});
