import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import { expectNoPersonalData } from '@/lib/platform/logging/testing';
import {
  changeUserStatus,
  type UserStatusChange,
} from '@/lib/users/use-cases/update-user-status';

const {
  mockLog,
  mockCountAvailability,
  mockUpdateUserStatus,
  mockFindUserById,
  mockNotifyApproved,
} = vi.hoisted(() => ({
  mockLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockCountAvailability: vi.fn(),
  mockUpdateUserStatus: vi.fn(),
  mockFindUserById: vi.fn(),
  mockNotifyApproved: vi.fn(),
}));

vi.mock('@/lib/apartments/queries/count-apartment-availability', () => ({
  countApartmentAvailability: mockCountAvailability,
}));

vi.mock('@/lib/users/mutations/update-user-status', () => ({
  updateUserStatus: mockUpdateUserStatus,
}));

vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: mockFindUserById,
}));

vi.mock('@/lib/users/use-cases/account-status', () => ({
  notifyAccountApproved: mockNotifyApproved,
}));

// Keeps the real admin-access helpers from loading the Prisma client
vi.mock('@/lib/users/queries/find-user-session-fields', () => ({
  findUserSessionFields: vi.fn(),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLog,
}));

const TENANT_EMAIL = 'tenant@example.com';

const PENDING_TENANT = {
  id: 'user-1',
  email: TENANT_EMAIL,
  name: 'Jan Kowalski',
  role: UserRole.TENANT,
  status: AccountStatus.PENDING,
};

function savedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: TENANT_EMAIL,
    name: 'Jan Kowalski',
    role: UserRole.TENANT,
    status: AccountStatus.APPROVED,
    emailVerified: true,
    mustChangePassword: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    apartments: [{ id: 'apt-1' }],
    ...overrides,
  };
}

function change(overrides: Partial<UserStatusChange> = {}): UserStatusChange {
  return {
    adminId: 'admin-1',
    userId: 'user-1',
    status: AccountStatus.APPROVED,
    apartmentIds: undefined,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockFindUserById.mockResolvedValue(PENDING_TENANT);
  mockUpdateUserStatus.mockResolvedValue(savedUser());
  mockCountAvailability.mockResolvedValue({ found: 0, occupiedByOthers: 0 });
  mockNotifyApproved.mockResolvedValue(undefined);
});

describe('changeUserStatus', () => {
  describe('input validation', () => {
    it.each([
      {
        label: 'a missing user ID',
        input: { userId: undefined },
        message: 'Brak wymaganych pól',
      },
      {
        label: 'an empty status',
        input: { status: '' },
        message: 'Brak wymaganych pól',
      },
      {
        label: 'a user ID that is not a string',
        input: { userId: 42 },
        message: 'Brak wymaganych pól',
      },
      {
        label: 'an apartment list that is not an array',
        input: { apartmentIds: 'apt-1' },
        message: 'Nieprawidłowa lista mieszkań',
      },
      {
        label: 'an apartment list set to null',
        input: { apartmentIds: null },
        message: 'Nieprawidłowa lista mieszkań',
      },
      {
        label: 'an apartment ID that is not a string',
        input: { apartmentIds: ['apt-1', 2] },
        message: 'Nieprawidłowa lista mieszkań',
      },
      {
        label: 'an unknown status',
        input: { status: 'SUSPENDED' },
        message: 'Nieprawidłowy status',
      },
    ])('rejects $label before reading the user', async ({ input, message }) => {
      const result = await changeUserStatus(change(input));

      expect(result).toEqual({ ok: false, code: 'invalid', message });
      expect(mockFindUserById).not.toHaveBeenCalled();
      expect(mockCountAvailability).not.toHaveBeenCalled();
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });
  });

  describe('lookup and apartment availability', () => {
    it('returns not found when the user does not exist', async () => {
      mockFindUserById.mockResolvedValueOnce(null);

      const result = await changeUserStatus(
        change({ apartmentIds: ['apt-1'] })
      );

      expect(result).toEqual({
        ok: false,
        code: 'not-found',
        message: 'Użytkownik nie znaleziony',
      });
      expect(mockCountAvailability).not.toHaveBeenCalled();
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });

    it('refuses to approve when some of the apartments do not exist', async () => {
      mockCountAvailability.mockResolvedValueOnce({
        found: 1,
        occupiedByOthers: 0,
      });

      const result = await changeUserStatus(
        change({ apartmentIds: ['apt-1', 'apt-2'] })
      );

      expect(result).toEqual({
        ok: false,
        code: 'not-found',
        message: 'Niektóre mieszkania nie zostały znalezione',
      });
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
      expect(mockNotifyApproved).not.toHaveBeenCalled();
    });

    it('refuses to approve when an apartment already belongs to another user', async () => {
      mockCountAvailability.mockResolvedValueOnce({
        found: 2,
        occupiedByOthers: 1,
      });

      const result = await changeUserStatus(
        change({ apartmentIds: ['apt-1', 'apt-2'] })
      );

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Niektóre mieszkania są już przypisane do innego użytkownika',
      });
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
      expect(mockNotifyApproved).not.toHaveBeenCalled();
    });
  });

  describe('approval', () => {
    it('approves the account, assigns the apartments and returns the saved user', async () => {
      mockCountAvailability.mockResolvedValueOnce({
        found: 2,
        occupiedByOthers: 0,
      });
      mockUpdateUserStatus.mockResolvedValueOnce(
        savedUser({ apartments: [{ id: 'apt-1' }, { id: 'apt-2' }] })
      );

      const result = await changeUserStatus(
        change({ apartmentIds: ['apt-1', 'apt-2'] })
      );

      expect(mockCountAvailability).toHaveBeenCalledWith(
        ['apt-1', 'apt-2'],
        'user-1'
      );
      expect(mockUpdateUserStatus).toHaveBeenCalledWith({
        userId: 'user-1',
        status: AccountStatus.APPROVED,
        apartmentIds: ['apt-1', 'apt-2'],
      });
      expect(result).toMatchObject({
        ok: true,
        data: {
          user: {
            id: 'user-1',
            status: AccountStatus.APPROVED,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
            apartments: [{ id: 'apt-1' }, { id: 'apt-2' }],
          },
        },
      });
    });

    it('approves without a list of apartments and does not check availability', async () => {
      const result = await changeUserStatus(
        change({ apartmentIds: undefined })
      );

      expect(result.ok).toBe(true);
      expect(mockCountAvailability).not.toHaveBeenCalled();
      expect(mockUpdateUserStatus).toHaveBeenCalledWith({
        userId: 'user-1',
        status: AccountStatus.APPROVED,
        apartmentIds: undefined,
      });
    });

    it('passes an empty apartment list through without checking availability', async () => {
      const result = await changeUserStatus(change({ apartmentIds: [] }));

      expect(result.ok).toBe(true);
      expect(mockCountAvailability).not.toHaveBeenCalled();
      expect(mockUpdateUserStatus).toHaveBeenCalledWith({
        userId: 'user-1',
        status: AccountStatus.APPROVED,
        apartmentIds: [],
      });
    });
  });

  describe('non-approving status changes', () => {
    it.each([AccountStatus.PENDING, AccountStatus.REJECTED])(
      'does not check apartment availability when the new status is %s',
      async (status) => {
        const result = await changeUserStatus(
          change({ status, apartmentIds: ['apt-1'] })
        );

        expect(result.ok).toBe(true);
        expect(mockCountAvailability).not.toHaveBeenCalled();
        expect(mockUpdateUserStatus).toHaveBeenCalledWith({
          userId: 'user-1',
          status,
          apartmentIds: ['apt-1'],
        });
      }
    );
  });

  describe('approval e-mail', () => {
    it('notifies the account holder when the account is approved for the first time', async () => {
      await changeUserStatus(change());

      expect(mockNotifyApproved).toHaveBeenCalledWith(
        TENANT_EMAIL,
        'Jan Kowalski'
      );
    });

    it('does not notify again when an already approved account is approved', async () => {
      mockFindUserById.mockResolvedValueOnce({
        ...PENDING_TENANT,
        status: AccountStatus.APPROVED,
      });

      const result = await changeUserStatus(change());

      expect(result.ok).toBe(true);
      expect(mockNotifyApproved).not.toHaveBeenCalled();
    });

    it('does not notify when the approved account is an administrator', async () => {
      mockUpdateUserStatus.mockResolvedValueOnce(
        savedUser({ role: UserRole.ADMIN })
      );

      await changeUserStatus(change());

      expect(mockNotifyApproved).not.toHaveBeenCalled();
    });

    it.each([AccountStatus.PENDING, AccountStatus.REJECTED])(
      'does not notify when the new status is %s',
      async (status) => {
        mockUpdateUserStatus.mockResolvedValueOnce(savedUser({ status }));

        await changeUserStatus(change({ status }));

        expect(mockNotifyApproved).not.toHaveBeenCalled();
      }
    );
  });

  describe('failures', () => {
    it('returns a failed result and logs the error when the update throws', async () => {
      const error = new Error('write failed');
      mockUpdateUserStatus.mockRejectedValueOnce(error);

      const result = await changeUserStatus(change());

      expect(result).toEqual({
        ok: false,
        code: 'failed',
        message: 'Nie udało się zaktualizować użytkownika',
      });
      expect(mockLog.error).toHaveBeenCalledWith(
        { error },
        'User update error'
      );
      expect(mockNotifyApproved).not.toHaveBeenCalled();
    });

    it('returns a failed result when the user lookup throws', async () => {
      mockFindUserById.mockRejectedValueOnce(new Error('DB down'));

      const result = await changeUserStatus(change());

      expect(result).toMatchObject({ ok: false, code: 'failed' });
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });
  });

  it('logs the outcome with IDs and apartment count, never the e-mail address', async () => {
    mockCountAvailability.mockResolvedValueOnce({
      found: 2,
      occupiedByOthers: 0,
    });
    mockUpdateUserStatus.mockResolvedValueOnce(
      savedUser({ apartments: [{ id: 'apt-1' }, { id: 'apt-2' }] })
    );

    await changeUserStatus(change({ apartmentIds: ['apt-1', 'apt-2'] }));

    expect(mockLog.info).toHaveBeenCalledWith(
      {
        adminId: 'admin-1',
        userId: 'user-1',
        status: AccountStatus.APPROVED,
        apartmentCount: 2,
      },
      'User status updated'
    );
    expectNoPersonalData(Object.values(mockLog), [TENANT_EMAIL]);
  });
});
