import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockFindTenantUsers = vi.fn();
const mockFindUserById = vi.fn();
const mockFindApartmentsByIds = vi.fn();
const mockUpdateUserStatus = vi.fn();
const mockNotifyAccountApproved = vi.fn();

vi.mock('@/auth', () => ({ auth: mockAuth }));

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

vi.mock('@/lib/queries/apartments/find-apartments-by-ids', () => ({
  findApartmentsByIds: mockFindApartmentsByIds,
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

function makePatchRequest(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
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
        UserRole.TENANT
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
        UserRole.ADMIN
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
        UserRole.TENANT
      );
    });
  });

  describe('PATCH', () => {
    it('does not send approval email when approving an admin user', async () => {
      mockFindUserById.mockResolvedValue({
        id: 'admin-user',
        email: 'target-admin@example.com',
        name: 'Target Admin',
        role: UserRole.ADMIN,
        status: AccountStatus.PENDING,
      });
      mockFindApartmentsByIds.mockResolvedValue([{ id: 'apt-1', user: null }]);
      mockUpdateUserStatus.mockResolvedValue({
        id: 'admin-user',
        email: 'target-admin@example.com',
        name: 'Target Admin',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        apartments: [{ id: 'apt-1' }],
      });

      const { PATCH } = await import('../route');

      const response = await PATCH(
        makePatchRequest({
          userId: 'admin-user',
          status: AccountStatus.APPROVED,
          apartmentIds: ['apt-1'],
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockNotifyAccountApproved).not.toHaveBeenCalled();
      expect(data.user.role).toBe(UserRole.ADMIN);
      expect(data.user).toHaveProperty('createdAt');
    });

    it('sends approval email when approving a tenant user for the first time', async () => {
      mockFindUserById.mockResolvedValue({
        id: 'tenant-user',
        email: 'tenant@example.com',
        name: 'Tenant User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
      });
      mockUpdateUserStatus.mockResolvedValue({
        id: 'tenant-user',
        email: 'tenant@example.com',
        name: 'Tenant User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        apartments: [],
      });

      const { PATCH } = await import('../route');

      const response = await PATCH(
        makePatchRequest({
          userId: 'tenant-user',
          status: AccountStatus.APPROVED,
          apartmentIds: [],
        })
      );

      expect(response.status).toBe(200);
      expect(mockNotifyAccountApproved).toHaveBeenCalledWith(
        'tenant@example.com',
        'Tenant User'
      );
    });

    it('keeps existing apartments when approving without apartmentIds', async () => {
      mockFindUserById.mockResolvedValue({
        id: 'tenant-user',
        email: 'tenant@example.com',
        name: 'Tenant User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
      });
      mockUpdateUserStatus.mockResolvedValue({
        id: 'tenant-user',
        email: 'tenant@example.com',
        name: 'Tenant User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        apartments: [{ id: 'apt-1' }],
      });

      const { PATCH } = await import('../route');

      const response = await PATCH(
        makePatchRequest({
          userId: 'tenant-user',
          status: AccountStatus.APPROVED,
        })
      );

      expect(response.status).toBe(200);
      expect(mockUpdateUserStatus).toHaveBeenCalledWith({
        userId: 'tenant-user',
        status: AccountStatus.APPROVED,
        apartmentIds: undefined,
      });
    });

    it('rejects invalid apartmentIds payloads', async () => {
      const { PATCH } = await import('../route');

      const response = await PATCH(
        makePatchRequest({
          userId: 'tenant-user',
          status: AccountStatus.APPROVED,
          apartmentIds: 'apt-1',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nieprawidłowa lista mieszkań');
      expect(mockFindUserById).not.toHaveBeenCalled();
    });
  });
});
