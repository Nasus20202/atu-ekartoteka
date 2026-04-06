import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockUser, mockUsers } from '@/__tests__/fixtures';
import { buildProviders, credentialsAuthorize } from '@/lib/auth/providers';
import { prisma } from '@/lib/database/prisma';
import { UserRole } from '@/lib/types';

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('@/lib/turnstile', () => ({
  isTurnstileEnabled: vi.fn(() => false),
  verifyTurnstileToken: vi.fn(),
}));

vi.mock('@/lib/auth/registration-auto-login-token', () => ({
  verifyRegistrationAutoLoginToken: vi.fn(() => false),
}));

vi.mock('@/lib/opentelemetry/auth-metrics', () => ({
  authMetrics: {
    recordLogin: vi.fn(),
    recordRegistration: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('credentialsAuthorize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('returns null when email is missing', async () => {
      const result = await credentialsAuthorize({ email: '', password: 'pw' });
      expect(result).toBeNull();
    });

    it('returns null when password is missing', async () => {
      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: '',
      });
      expect(result).toBeNull();
    });

    it('returns null when credentials are undefined', async () => {
      const result = await credentialsAuthorize(undefined);
      expect(result).toBeNull();
    });
  });

  describe('turnstile bypass for registration auto-login', () => {
    it('allows login with valid auto-login bypass token when turnstile is enabled', async () => {
      const { isTurnstileEnabled, verifyTurnstileToken } =
        await import('@/lib/turnstile');
      const { verifyRegistrationAutoLoginToken } =
        await import('@/lib/auth/registration-auto-login-token');
      vi.mocked(isTurnstileEnabled).mockReturnValue(true);
      vi.mocked(verifyRegistrationAutoLoginToken).mockReturnValue(true);

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.tenant);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
        autoLoginBypassToken: 'valid-bypass',
      });

      expect(result).not.toBeNull();
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
      expect(verifyRegistrationAutoLoginToken).toHaveBeenCalledWith(
        'valid-bypass',
        'test@example.com'
      );
    });
  });

  describe('user lookup', () => {
    it('returns null when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await credentialsAuthorize({
        email: 'nonexistent@example.com',
        password: 'pw',
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('returns null when user has no password (OAuth user)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(
        createMockUser({ password: null } as never)
      );

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'pw',
      });

      expect(result).toBeNull();
    });
  });

  describe('password verification', () => {
    it('returns null when password does not match', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(result).toBeNull();
    });

    it('returns user when password matches', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
      });

      expect(result).not.toBeNull();
    });
  });

  describe('successful authentication', () => {
    it('returns correct user object for tenant', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.tenant);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'test@example.com',
        password: 'correct',
      });

      expect(result).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.TENANT,
        mustChangePassword: false,
      });
    });

    it('returns correct user object for admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.admin);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'admin@example.com',
        password: 'correct',
      });

      expect(result).toMatchObject({
        role: UserRole.ADMIN,
      });
    });

    it('includes mustChangePassword: true for bulk-created users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(
        mockUsers.mustChangePassword
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await credentialsAuthorize({
        email: 'mcp@example.com',
        password: 'correct',
      });

      expect(result).toMatchObject({ mustChangePassword: true });
    });

    it('handles user with null name', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(
        createMockUser({ name: null })
      );
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
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(
        credentialsAuthorize({ email: 'test@example.com', password: 'pw' })
      ).rejects.toThrow('Database connection error');
    });

    it('propagates bcrypt errors', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser());
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

    const providers = buildProviders();
    const ids = providers.map((p) => (p as { id?: string }).id);

    expect(ids).not.toContain('google');
    expect(ids).toContain('credentials');
  });

  it('includes Google provider when env vars are set', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

    const providers = buildProviders();
    const ids = providers.map((p) => (p as { id?: string }).id);

    expect(ids).toContain('google');
    expect(ids).toContain('credentials');

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });
});
