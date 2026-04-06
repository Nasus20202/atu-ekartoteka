import type { JWT } from 'next-auth/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockUser, mockUsers } from '@/__tests__/fixtures';
import { callbacks } from '@/lib/auth/callbacks';
import { prisma } from '@/lib/database/prisma';
import { UserRole } from '@/lib/types';

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/notifications/new-user-registration', () => ({
  notifyAdminsOfNewUser: vi.fn(),
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

function makeToken(overrides: Partial<JWT> = {}): JWT {
  return { sub: 'user-123', ...overrides } as JWT;
}

describe('callbacks.jwt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates token from user on first sign-in', async () => {
    const token = makeToken();
    const user = mockUsers.tenant;

    const result = await callbacks!.jwt!({
      token,
      user: user as never,
      trigger: 'signIn',
      account: null,
      session: undefined,
    });

    expect(result!.id).toBe('user-123');
    expect(result!.role).toBe(UserRole.TENANT);
    expect(result!.mustChangePassword).toBe(false);
  });

  it('sets mustChangePassword: true when user requires it', async () => {
    const token = makeToken();

    const result = await callbacks!.jwt!({
      token,
      user: mockUsers.mustChangePassword as never,
      trigger: 'signIn',
      account: null,
      session: undefined,
    });

    expect(result!.mustChangePassword).toBe(true);
  });

  it('refreshes token data from DB on update trigger', async () => {
    const token = makeToken({ id: 'user-123' });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      createMockUser({ mustChangePassword: false })
    );

    const result = await callbacks!.jwt!({
      token,
      user: undefined as never,
      trigger: 'update',
      account: null,
      session: undefined,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        role: true,
        mustChangePassword: true,
      },
    });
    expect(result!.mustChangePassword).toBe(false);
  });

  it('does not fetch DB on signIn trigger', async () => {
    const token = makeToken({ id: 'user-123' });

    await callbacks!.jwt!({
      token,
      user: mockUsers.tenant as never,
      trigger: 'signIn',
      account: null,
      session: undefined,
    });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('callbacks.session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates session.user from JWT token', async () => {
    const session = {
      user: { name: 'Test', email: 'test@example.com', image: null },
      expires: '',
    };
    const token = makeToken({
      id: 'user-123',
      role: UserRole.TENANT,
      mustChangePassword: false,
    });

    const result = await callbacks!.session!({
      session: session as never,
      token,
      user: undefined as never,
      newSession: undefined,
      trigger: 'update',
    });

    expect(result.user).toMatchObject({
      id: 'user-123',
      role: UserRole.TENANT,
      mustChangePassword: false,
    });
  });

  it('returns session unchanged when token has no id', async () => {
    const session = {
      user: { name: 'Test', email: 'test@example.com', image: null },
      expires: '',
    };
    const token = makeToken();

    const result = await callbacks!.session!({
      session: session as never,
      token,
      user: undefined as never,
      newSession: undefined,
      trigger: 'update',
    });

    expect((result.user as { id?: string }).id).toBeUndefined();
  });
});

describe('callbacks.signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true immediately for credentials provider', async () => {
    const result = await callbacks!.signIn!({
      user: mockUsers.tenant as never,
      account: { provider: 'credentials' } as never,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    });

    expect(result).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('creates new user on first Google sign-in', async () => {
    const newDbUser = {
      ...createMockUser({ id: 'new-user-id' }),
      createdAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(newDbUser as never);

    const googleUser = {
      id: undefined,
      email: 'new@gmail.com',
      name: 'New Google User',
    };

    const result = await callbacks!.signIn!({
      user: googleUser as never,
      account: { provider: 'google' } as never,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    });

    expect(result).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@gmail.com',
          emailVerified: true,
          password: null,
        }),
      })
    );
    expect(googleUser.id).toBe('new-user-id');
  });

  it('populates user fields from existing user on subsequent Google sign-in', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.tenant);

    const googleUser = {
      id: undefined,
      email: 'test@example.com',
      name: 'Test User',
    } as Record<string, unknown>;

    const result = await callbacks!.signIn!({
      user: googleUser as never,
      account: { provider: 'google' } as never,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    });

    expect(result).toBe(true);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(googleUser.id).toBe('user-123');
    expect(googleUser.role).toBe(UserRole.TENANT);
  });

  it('returns false when Google sign-in throws', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB error'));

    const result = await callbacks!.signIn!({
      user: { email: 'err@example.com' } as never,
      account: { provider: 'google' } as never,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    });

    expect(result).toBe(false);
  });
});
