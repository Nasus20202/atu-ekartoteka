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

const asInput = (body: unknown) => body;

// The data of a successful result, or the failure itself
function dataOf(result: { ok: boolean }) {
  const value = result as any;
  return value.ok ? value.data : value;
}

describe('updateUserStatusAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession());
  });

  it('does not send approval email when approving an admin user', async () => {
    mockFindUserById.mockResolvedValue({
      id: 'admin-user',
      email: 'target-admin@example.com',
      name: 'Target Admin',
      role: UserRole.ADMIN,
      status: AccountStatus.PENDING,
    });
    mockCountApartmentAvailability.mockResolvedValue({
      found: 1,
      occupiedByOthers: 0,
    });
    mockUpdateUserStatus.mockResolvedValue({
      id: 'admin-user',
      email: 'target-admin@example.com',
      name: 'Target Admin',
      role: UserRole.ADMIN,
      status: AccountStatus.APPROVED,
      apartments: [{ id: 'apt-1' }],
    });

    const { updateUserStatusAction } = await import('@/actions/users/users');

    const result = await updateUserStatusAction({
      userId: 'admin-user',
      status: AccountStatus.APPROVED,
      apartmentIds: ['apt-1'],
    });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
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

    const { updateUserStatusAction } = await import('@/actions/users/users');

    const result = await updateUserStatusAction({
      userId: 'tenant-user',
      status: AccountStatus.APPROVED,
      apartmentIds: [],
    });

    expect(result.ok).toBe(true);
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

    const { updateUserStatusAction } = await import('@/actions/users/users');

    const result = await updateUserStatusAction({
      userId: 'tenant-user',
      status: AccountStatus.APPROVED,
    });

    expect(result.ok).toBe(true);
    expect(mockUpdateUserStatus).toHaveBeenCalledWith({
      userId: 'tenant-user',
      status: AccountStatus.APPROVED,
      apartmentIds: undefined,
    });
  });

  it('rejects invalid apartmentIds payloads', async () => {
    const { updateUserStatusAction } = await import('@/actions/users/users');

    const result = await updateUserStatusAction({
      userId: 'tenant-user',
      status: AccountStatus.APPROVED,
      apartmentIds: 'apt-1',
    });
    const data = dataOf(result);

    expect(result).toMatchObject({ ok: false, code: 'invalid' });
    expect(data.error).toBe('Nieprawidłowa lista mieszkań');
    expect(mockFindUserById).not.toHaveBeenCalled();
  });

  describe('validation and errors', () => {
    const tenant = {
      id: 'tenant-user',
      email: 'tenant@example.com',
      name: 'Tenant User',
      role: UserRole.TENANT,
      status: AccountStatus.PENDING,
    };

    const approve = (apartmentIds?: string[]) =>
      asInput({
        userId: 'tenant-user',
        status: AccountStatus.APPROVED,
        apartmentIds,
      });

    it.each([
      [null, 'unauthenticated'],
      [
        {
          user: {
            id: 'user-1',
            email: 'jan@example.com',
            role: UserRole.TENANT,
          },
        },
        'forbidden',
      ],
    ])('rejects a non-admin session (%o)', async (session, expected) => {
      mockAuth.mockResolvedValue(session);
      const { updateUserStatusAction } = await import('@/actions/users/users');

      const result = await updateUserStatusAction(approve());

      expect(result).toMatchObject({ ok: false, code: expected });
    });

    it.each([
      [{ status: AccountStatus.APPROVED }, 'Brak wymaganych pól'],
      [{ userId: 'tenant-user', status: 'UNKNOWN' }, 'Nieprawidłowy status'],
      [
        {
          userId: 'tenant-user',
          status: AccountStatus.APPROVED,
          apartmentIds: [1],
        },
        'Nieprawidłowa lista mieszkań',
      ],
    ])('rejects the payload %o', async (body, error) => {
      const { updateUserStatusAction } = await import('@/actions/users/users');

      const result = await updateUserStatusAction(body);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(result).toMatchObject({ ok: false, code: 'invalid', error });
    });

    it('returns a not-found result for an unknown user', async () => {
      mockFindUserById.mockResolvedValue(null);
      const { updateUserStatusAction } = await import('@/actions/users/users');

      const result = await updateUserStatusAction(approve());

      expect(result).toMatchObject({ ok: false, code: 'not-found' });
    });

    it('returns a not-found result when some apartments do not exist', async () => {
      mockFindUserById.mockResolvedValue(tenant);
      mockCountApartmentAvailability.mockResolvedValue({
        found: 1,
        occupiedByOthers: 0,
      });
      const { updateUserStatusAction } = await import('@/actions/users/users');

      const result = await updateUserStatusAction(approve(['apt-1', 'apt-2']));

      expect(result).toMatchObject({ ok: false, code: 'not-found' });
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });

    it('rejects apartments assigned to another user', async () => {
      mockFindUserById.mockResolvedValue(tenant);
      mockCountApartmentAvailability.mockResolvedValue({
        found: 1,
        occupiedByOthers: 1,
      });
      const { updateUserStatusAction } = await import('@/actions/users/users');

      const result = await updateUserStatusAction(approve(['apt-1']));

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });

    it('allows apartments already assigned to the same user and skips the email for approved users', async () => {
      mockFindUserById.mockResolvedValue({
        ...tenant,
        status: AccountStatus.APPROVED,
      });
      mockCountApartmentAvailability.mockResolvedValue({
        found: 1,
        occupiedByOthers: 0,
      });
      mockUpdateUserStatus.mockResolvedValue({
        ...tenant,
        status: AccountStatus.APPROVED,
        apartments: [{ id: 'apt-1' }],
      });
      const { updateUserStatusAction } = await import('@/actions/users/users');

      const result = await updateUserStatusAction(approve(['apt-1']));

      expect(result.ok).toBe(true);
      expect(mockNotifyAccountApproved).not.toHaveBeenCalled();
    });

    it.each([[new Error('db down')], ['db down']])(
      'reports a failure when the update throws %o',
      async (error) => {
        mockFindUserById.mockRejectedValue(error);
        const { updateUserStatusAction } =
          await import('@/actions/users/users');

        const result = await updateUserStatusAction(approve());

        expect(result).toEqual({
          ok: false,
          code: 'failed',
          error: 'Nie udało się zaktualizować użytkownika',
        });
      }
    );
  });
});
