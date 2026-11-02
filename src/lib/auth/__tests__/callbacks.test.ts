import type { JWT } from 'next-auth/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockUser, mockUsers } from '@/__tests__/fixtures';
import { callbacks } from '@/lib/auth/callbacks';
import { prisma } from '@/lib/database/prisma';

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

    const result = await callbacks!.jwt!({
      token,
      user: mockUsers.tenant as never,
      trigger: 'signIn',
      account: null,
      session: undefined,
    });

    // Auth.js derives `sub` from the provider user; the callback only adds
    // the fields the application needs.
    expect(result!.sub).toBe('user-123');
    expect(result!.mustChangePassword).toBe(false);
  });

  it('never puts a role claim in the token', async () => {
    const token = makeToken();

    const result = await callbacks!.jwt!({
      token,
      user: mockUsers.admin as never,
      trigger: 'signIn',
      account: null,
      session: undefined,
    });

    expect(result).not.toHaveProperty('role');
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

  it('refreshes the forced-change flag from the DB on update', async () => {
    const token = makeToken({ mustChangePassword: true });
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
        status: true,
        mustChangePassword: true,
      },
    });
    expect(result!.mustChangePassword).toBe(false);
  });

  it('returns null to sign out when the user no longer exists on update', async () => {
    const token = makeToken();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await callbacks!.jwt!({
      token,
      user: undefined as never,
      trigger: 'update',
      account: null,
      session: undefined,
    });

    expect(result).toBeNull();
  });

  it('does not fetch the DB on signIn trigger', async () => {
    await callbacks!.jwt!({
      token: makeToken(),
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

  it('exposes only the id and the forced-change flag', async () => {
    const session = {
      user: { name: 'Test', email: 'test@example.com', image: null },
      expires: '',
    };
    const token = makeToken({ mustChangePassword: false });

    const result = await callbacks!.session!({
      session: session as never,
      token,
      user: undefined as never,
      newSession: undefined,
      trigger: 'update',
    });

    expect(result.user).toMatchObject({
      id: 'user-123',
      mustChangePassword: false,
    });
    expect(result.user).not.toHaveProperty('role');
  });

  it('returns session unchanged when the token has no subject', async () => {
    const session = {
      user: { name: 'Test', email: 'test@example.com', image: null },
      expires: '',
    };
    const token = makeToken({ sub: undefined });

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

  it('returns true immediately for the credentials provider', async () => {
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

  it('creates a new user on first Google sign-in', async () => {
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

  it('still signs in a new Google user when notifying admins fails', async () => {
    const { notifyAdminsOfNewUser } =
      await import('@/lib/notifications/new-user-registration');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...createMockUser({ id: 'new-user-id' }),
      name: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(notifyAdminsOfNewUser).mockRejectedValue(new Error('smtp'));

    const result = await callbacks!.signIn!({
      user: { email: 'new@gmail.com' } as never,
      account: { provider: 'google' } as never,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    });

    expect(result).toBe(true);
    expect(notifyAdminsOfNewUser).toHaveBeenCalledWith(
      'test@example.com',
      'Nie podano imienia',
      expect.any(Date)
    );
  });

  it('links an existing account by normalised email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.tenant);

    const googleUser = {
      id: undefined,
      email: 'TEST@example.com',
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
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(googleUser.id).toBe('user-123');
    expect(googleUser.mustChangePassword).toBe(false);
  });

  it('refuses a profile Google marked as unverified', async () => {
    const result = await callbacks!.signIn!({
      user: { email: 'unverified@gmail.com' } as never,
      account: { provider: 'google' } as never,
      profile: { email_verified: false } as never,
      email: undefined,
      credentials: undefined,
    });

    expect(result).toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
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
