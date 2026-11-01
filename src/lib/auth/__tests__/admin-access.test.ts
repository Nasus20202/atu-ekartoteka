import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hasAdminAccess, isApprovedAdmin } from '@/lib/auth/admin-access';
import { AccountStatus, UserRole } from '@/lib/types';

const { mockFindUserSessionFields, mockWarn } = vi.hoisted(() => ({
  mockFindUserSessionFields: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ warn: mockWarn }),
}));
vi.mock('@/lib/queries/users/find-user-session-fields', () => ({
  findUserSessionFields: mockFindUserSessionFields,
}));

describe('isApprovedAdmin', () => {
  it('accepts an approved admin', () => {
    expect(
      isApprovedAdmin({
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
      })
    ).toBe(true);
  });

  it('rejects a tenant', () => {
    expect(
      isApprovedAdmin({
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
      })
    ).toBe(false);
  });

  it.each([AccountStatus.PENDING, AccountStatus.REJECTED])(
    'rejects an admin with status %s',
    (status) => {
      expect(isApprovedAdmin({ role: UserRole.ADMIN, status })).toBe(false);
    }
  );

  it('rejects a missing user', () => {
    expect(isApprovedAdmin(null)).toBe(false);
  });
});

describe('hasAdminAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the access fields for the given user', async () => {
    mockFindUserSessionFields.mockResolvedValue({
      role: UserRole.ADMIN,
      status: AccountStatus.APPROVED,
    });

    expect(await hasAdminAccess('user-123')).toBe(true);
    expect(mockFindUserSessionFields).toHaveBeenCalledWith('user-123');
  });

  it('denies access and warns when the user was deleted', async () => {
    mockFindUserSessionFields.mockResolvedValue(null);

    expect(await hasAdminAccess('user-123')).toBe(false);
    expect(mockWarn).toHaveBeenCalledWith(
      { userId: 'user-123' },
      'Admin access check failed: user no longer exists'
    );
  });
});
