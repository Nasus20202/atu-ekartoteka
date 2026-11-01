import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdmin, UNAUTHORIZED_MESSAGE } from '@/lib/auth/require-admin';
import { AccountStatus, UserRole } from '@/lib/types';

const { mockAuth, mockFindUserSessionFields, mockWarn } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUserSessionFields: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ warn: mockWarn }),
}));
vi.mock('@/lib/queries/users/find-user-session-fields', () => ({
  findUserSessionFields: mockFindUserSessionFields,
}));

function approvedAdmin() {
  return { role: UserRole.ADMIN, status: AccountStatus.APPROVED };
}

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUserSessionFields.mockResolvedValue(approvedAdmin());
  });

  it('returns the session of an admin', async () => {
    const session = {
      user: { id: 'admin-id', email: 'a@b.pl', role: UserRole.ADMIN },
    };
    mockAuth.mockResolvedValue(session);

    expect(await requireAdmin('attempt')).toEqual({ session });
    expect(mockFindUserSessionFields).toHaveBeenCalledWith('admin-id');
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('rejects a tenant and logs the attempt', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'tenant-id', email: 't@b.pl', role: UserRole.TENANT },
    });

    const { response } = await requireAdmin('attempt');

    expect(response?.status).toBe(401);
    expect(await response?.json()).toEqual({ error: UNAUTHORIZED_MESSAGE });
    expect(mockWarn).toHaveBeenCalledWith({ email: 't@b.pl' }, 'attempt');
    expect(mockFindUserSessionFields).not.toHaveBeenCalled();
  });

  it('rejects an admin demoted in the database without a re-login', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-id', email: 'a@b.pl', role: UserRole.ADMIN },
    });
    mockFindUserSessionFields.mockResolvedValue({
      role: UserRole.TENANT,
      status: AccountStatus.APPROVED,
    });

    const { response } = await requireAdmin('attempt');

    expect(response?.status).toBe(401);
    expect(mockWarn).toHaveBeenCalledWith({ email: 'a@b.pl' }, 'attempt');
  });

  it('rejects an admin whose account is no longer approved', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-id', email: 'a@b.pl', role: UserRole.ADMIN },
    });
    mockFindUserSessionFields.mockResolvedValue({
      role: UserRole.ADMIN,
      status: AccountStatus.REJECTED,
    });

    const { response } = await requireAdmin();

    expect(response?.status).toBe(401);
  });

  it('rejects an admin whose account was deleted', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-id', email: 'a@b.pl', role: UserRole.ADMIN },
    });
    mockFindUserSessionFields.mockResolvedValue(null);

    const { response } = await requireAdmin();

    expect(response?.status).toBe(401);
  });

  it('rejects anonymous requests without logging by default', async () => {
    mockAuth.mockResolvedValue(null);

    const { response } = await requireAdmin();

    expect(response?.status).toBe(401);
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('logs anonymous attempts', async () => {
    mockAuth.mockResolvedValue(null);

    await requireAdmin('attempt');

    expect(mockWarn).toHaveBeenCalledWith({ email: 'anonymous' }, 'attempt');
  });
});
