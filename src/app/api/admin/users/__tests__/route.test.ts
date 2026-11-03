import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockFindTenantUsers = vi.fn();
const mockFindUserById = vi.fn();
const mockCountApartmentAvailability = vi.fn();
const mockUpdateUserStatus = vi.fn();
const mockNotifyAccountApproved = vi.fn();

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: vi.fn((userId: string) =>
    Promise.resolve(userId.startsWith('admin'))
  ),
  isAdminRole: (role: string | null | undefined) => role === 'ADMIN',
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/lib/queries/users/find-tenant-users', () => ({
  findTenantUsers: mockFindTenantUsers,
}));

vi.mock('@/lib/queries/users/find-user-by-id', () => ({
  findUserById: mockFindUserById,
}));

vi.mock('@/lib/queries/apartments/count-apartment-availability', () => ({
  countApartmentAvailability: mockCountApartmentAvailability,
}));

vi.mock('@/lib/mutations/users/update-user-status', () => ({
  updateUserStatus: mockUpdateUserStatus,
}));

vi.mock('@/lib/notifications/account-status', () => ({
  notifyAccountApproved: mockNotifyAccountApproved,
}));

function adminSession() {
  return {
    user: { id: 'admin-id', email: 'admin@example.com', role: UserRole.ADMIN },
    expires: new Date().toISOString(),
  };
}

function makeGetRequest(searchParams?: Record<string, string>) {
  const url = new URL('http://localhost/api/admin/users');
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  return { url: url.toString() } as NextRequest;
}

describe('/api/admin/users route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
    mockFindTenantUsers.mockResolvedValue({ users: [], total: 0 });
  });

  describe('GET', () => {
    it('returns tenant users by default', async () => {
      const { GET } = await import('../route');

      const response = await GET(makeGetRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockFindTenantUsers).toHaveBeenCalledWith(
        null,
        1,
        50,
        null,
        UserRole.TENANT,
        undefined,
        'asc'
      );
      expect(data.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      });
    });

    it('returns admins of all statuses when role=ADMIN', async () => {
      mockFindTenantUsers.mockResolvedValue({
        users: [
          {
            id: 'admin-1',
            email: 'admin1@example.com',
            name: 'Admin One',
            role: UserRole.ADMIN,
            status: AccountStatus.APPROVED,
            apartments: [],
          },
          {
            id: 'admin-2',
            email: 'admin2@example.com',
            name: 'Admin Two',
            role: UserRole.ADMIN,
            status: AccountStatus.REJECTED,
            apartments: [],
          },
        ],
        total: 2,
      });

      const { GET } = await import('../route');

      const response = await GET(
        makeGetRequest({ role: 'ADMIN', status: 'PENDING', limit: '20' })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockFindTenantUsers).toHaveBeenCalledWith(
        null,
        1,
        20,
        null,
        UserRole.ADMIN,
        undefined,
        'asc'
      );
      expect(data.users).toHaveLength(2);
      expect(data.users[0].createdAt).toBeTypeOf('string');
      expect(
        data.users.every(
          (user: { role: UserRole }) => user.role === UserRole.ADMIN
        )
      ).toBe(true);
    });

    it('rejects invalid role values', async () => {
      const { GET } = await import('../route');

      const response = await GET(makeGetRequest({ role: 'SUPERADMIN' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nieprawidłowa rola');
      expect(mockFindTenantUsers).not.toHaveBeenCalled();
    });

    it('rejects invalid tenant status values', async () => {
      const { GET } = await import('../route');

      const response = await GET(makeGetRequest({ status: 'WAITING' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nieprawidłowy status');
      expect(mockFindTenantUsers).not.toHaveBeenCalled();
    });

    it('falls back to default pagination for invalid page and limit', async () => {
      const { GET } = await import('../route');

      const response = await GET(
        makeGetRequest({ page: 'foo', limit: '-10', search: '  jan  ' })
      );

      expect(response.status).toBe(200);
      expect(mockFindTenantUsers).toHaveBeenCalledWith(
        null,
        1,
        50,
        'jan',
        UserRole.TENANT,
        undefined,
        'asc'
      );
    });

    it('passes the requested sort column and direction', async () => {
      const { GET } = await import('../route');

      const response = await GET(
        makeGetRequest({ sort: 'name', order: 'desc' })
      );

      expect(response.status).toBe(200);
      expect(mockFindTenantUsers).toHaveBeenCalledWith(
        null,
        1,
        50,
        null,
        UserRole.TENANT,
        'name',
        'desc'
      );
    });

    it.each([
      [{ sort: 'createdAt' }, 'Nieprawidłowe sortowanie'],
      [{ order: 'sideways' }, 'Nieprawidłowe sortowanie'],
    ])('rejects invalid sorting params (%o)', async (params, message) => {
      const { GET } = await import('../route');

      const response = await GET(makeGetRequest(params));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(message);
      expect(mockFindTenantUsers).not.toHaveBeenCalled();
    });
  });

  describe('GET validation and errors', () => {
    it.each([
      [null, 401],
      [
        {
          user: {
            id: 'user-1',
            email: 'jan@example.com',
            role: UserRole.TENANT,
          },
        },
        403,
      ],
    ])('rejects a non-admin session (%o)', async (session, expected) => {
      mockAuth.mockResolvedValue(session);
      const { GET } = await import('../route');

      const response = await GET(makeGetRequest());

      expect(response.status).toBe(expected);
    });

    it('passes a trimmed search to the query', async () => {
      const { GET } = await import('../route');

      await GET(makeGetRequest({ search: '  jan  ' }));

      expect(mockFindTenantUsers).toHaveBeenCalledWith(
        null,
        1,
        50,
        'jan',
        UserRole.TENANT,
        undefined,
        'asc'
      );
    });

    it.each([
      [new Error('db down'), 'db down'],
      ['db down', 'Nieznany błąd'],
    ])('returns 500 when loading fails with %o', async (error, message) => {
      mockFindTenantUsers.mockRejectedValue(error);
      const { GET } = await import('../route');

      const response = await GET(makeGetRequest());

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({ message });
    });
  });
});
