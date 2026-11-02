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
  return {
    role: UserRole.ADMIN,
    status: AccountStatus.APPROVED,
    mustChangePassword: false,
  };
}

function sessionFor(id: string, email: string) {
  return { user: { id, email, mustChangePassword: false } };
}

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUserSessionFields.mockResolvedValue(approvedAdmin());
  });

  it('returns the session of an admin', async () => {
    const session = sessionFor('admin-id', 'a@b.pl');
    mockAuth.mockResolvedValue(session);

    expect(await requireAdmin('attempt')).toEqual({ session });
    expect(mockFindUserSessionFields).toHaveBeenCalledWith('admin-id');
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('rejects a tenant with 403 and logs the attempt', async () => {
    mockAuth.mockResolvedValue(sessionFor('tenant-id', 't@b.pl'));
    mockFindUserSessionFields.mockResolvedValue({
      ...approvedAdmin(),
      role: UserRole.TENANT,
    });

    const { response } = await requireAdmin('attempt');

    expect(response?.status).toBe(403);
    expect(await response?.json()).toEqual({ error: UNAUTHORIZED_MESSAGE });
    expect(mockWarn).toHaveBeenCalledWith({ email: 't@b.pl' }, 'attempt');
  });

  it('always resolves the role from the database', async () => {
    mockAuth.mockResolvedValue(sessionFor('user-id', 'u@b.pl'));

    await requireAdmin();

    expect(mockFindUserSessionFields).toHaveBeenCalledWith('user-id');
  });

  it('rejects an admin demoted in the database without a re-login', async () => {
    mockAuth.mockResolvedValue(sessionFor('admin-id', 'a@b.pl'));
    mockFindUserSessionFields.mockResolvedValue({
      ...approvedAdmin(),
      role: UserRole.TENANT,
    });

    const { response } = await requireAdmin('attempt');

    expect(response?.status).toBe(403);
    expect(mockWarn).toHaveBeenCalledWith({ email: 'a@b.pl' }, 'attempt');
  });

  it('rejects an admin whose account is no longer approved', async () => {
    mockAuth.mockResolvedValue(sessionFor('admin-id', 'a@b.pl'));
    mockFindUserSessionFields.mockResolvedValue({
      ...approvedAdmin(),
      status: AccountStatus.REJECTED,
    });

    const { response } = await requireAdmin();

    expect(response?.status).toBe(403);
  });

  it('rejects an admin whose account was deleted', async () => {
    mockAuth.mockResolvedValue(sessionFor('admin-id', 'a@b.pl'));
    mockFindUserSessionFields.mockResolvedValue(null);

    const { response } = await requireAdmin();

    expect(response?.status).toBe(403);
  });

  it('rejects anonymous requests with 401 without a database lookup', async () => {
    mockAuth.mockResolvedValue(null);

    const { response } = await requireAdmin();

    expect(response?.status).toBe(401);
    expect(mockFindUserSessionFields).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('logs anonymous attempts', async () => {
    mockAuth.mockResolvedValue(null);

    await requireAdmin('attempt');

    expect(mockWarn).toHaveBeenCalledWith({ email: 'anonymous' }, 'attempt');
  });
});
