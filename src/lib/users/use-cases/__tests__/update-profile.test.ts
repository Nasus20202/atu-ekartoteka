import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import { PASSWORD_TOO_SHORT_MESSAGE } from '@/lib/auth/password-rules';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import { expectNoPersonalData } from '@/lib/platform/logging/testing';
import {
  type ProfileChanges,
  updateProfile,
} from '@/lib/users/use-cases/update-profile';

const {
  mockLog,
  mockBcryptHash,
  mockBcryptCompare,
  mockUpdateUserProfile,
  mockFindUserById,
} = vi.hoisted(() => ({
  mockLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockBcryptHash: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockUpdateUserProfile: vi.fn(),
  mockFindUserById: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: { hash: mockBcryptHash, compare: mockBcryptCompare },
}));

vi.mock('@/lib/users/mutations/update-user-profile', () => ({
  updateUserProfile: mockUpdateUserProfile,
}));

vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: mockFindUserById,
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLog,
}));

const STORED_HASH = 'stored-hash';
const NEW_HASH = 'new-hash';

function member(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    password: STORED_HASH,
    mustChangePassword: false,
    ...overrides,
  };
}

function savedProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'tenant@example.com',
    name: 'Jan Kowalski',
    role: UserRole.TENANT,
    status: AccountStatus.APPROVED,
    emailVerified: true,
    mustChangePassword: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockFindUserById.mockResolvedValue(member());
  mockUpdateUserProfile.mockResolvedValue(savedProfile());
  mockBcryptCompare.mockResolvedValue(true);
  mockBcryptHash.mockResolvedValue(NEW_HASH);
});

describe('updateProfile', () => {
  describe('name changes', () => {
    it('updates only the name and leaves the password untouched', async () => {
      mockUpdateUserProfile.mockResolvedValueOnce(
        savedProfile({ name: 'Anna Nowak' })
      );

      const result = await updateProfile('user-1', { name: 'Anna Nowak' });

      expect(result).toMatchObject({
        ok: true,
        data: {
          id: 'user-1',
          name: 'Anna Nowak',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        id: 'user-1',
        name: 'Anna Nowak',
      });
      expect(mockUpdateUserProfile.mock.calls[0][0]).not.toHaveProperty(
        'password'
      );
      expect(mockBcryptCompare).not.toHaveBeenCalled();
      expect(mockBcryptHash).not.toHaveBeenCalled();
    });

    it('clears the name when an empty string is sent', async () => {
      await updateProfile('user-1', { name: '' });

      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        id: 'user-1',
        name: null,
      });
    });
  });

  describe('password changes', () => {
    it('changes the password after the current password is verified', async () => {
      const result = await updateProfile('user-1', {
        currentPassword: 'old-password-1',
        newPassword: 'new-password-1',
      });

      expect(result.ok).toBe(true);
      expect(mockBcryptCompare).toHaveBeenCalledWith(
        'old-password-1',
        STORED_HASH
      );
      expect(mockBcryptHash).toHaveBeenCalledWith(
        'new-password-1',
        BCRYPT_COST
      );
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        id: 'user-1',
        password: NEW_HASH,
        mustChangePassword: false,
      });
    });

    it('does not check the current password for a user who must change it, and clears the flag', async () => {
      mockFindUserById.mockResolvedValueOnce(
        member({ mustChangePassword: true })
      );

      const result = await updateProfile('user-1', {
        currentPassword: 'stale-value',
        newPassword: 'new-password-1',
      });

      expect(result.ok).toBe(true);
      expect(mockBcryptCompare).not.toHaveBeenCalled();
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        id: 'user-1',
        password: NEW_HASH,
        mustChangePassword: false,
      });
    });

    it.each([
      { label: 'no current password', currentPassword: undefined },
      { label: 'an empty current password', currentPassword: '' },
      {
        label: 'a current password that is not a string',
        currentPassword: 123,
      },
    ])(
      'rejects a change with $label for a user who is not forced to change it',
      async ({ currentPassword }) => {
        const result = await updateProfile('user-1', {
          currentPassword,
          newPassword: 'new-password-1',
        });

        expect(result).toEqual({
          ok: false,
          code: 'invalid',
          message: 'Obecne hasło jest wymagane aby zmienić hasło',
        });
        expect(mockBcryptCompare).not.toHaveBeenCalled();
        expect(mockBcryptHash).not.toHaveBeenCalled();
        expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      }
    );

    it('rejects a wrong current password and logs the attempt without the password', async () => {
      mockBcryptCompare.mockResolvedValueOnce(false);

      const result = await updateProfile('user-1', {
        currentPassword: 'wrong-password',
        newPassword: 'new-password-1',
      });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Obecne hasło jest nieprawidłowe',
      });
      expect(mockLog.warn).toHaveBeenCalledWith(
        { userId: 'user-1' },
        'Failed password change attempt: incorrect current password'
      );
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('refuses a password change for an account that has no stored password', async () => {
      mockFindUserById.mockResolvedValueOnce(member({ password: null }));

      const result = await updateProfile('user-1', {
        currentPassword: 'anything-1',
        newPassword: 'new-password-1',
      });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Obecne hasło jest nieprawidłowe',
      });
      expect(mockBcryptCompare).not.toHaveBeenCalled();
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('checks the new password length before asking for the current password', async () => {
      const result = await updateProfile('user-1', { newPassword: 'short' });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: PASSWORD_TOO_SHORT_MESSAGE,
      });
      expect(mockBcryptCompare).not.toHaveBeenCalled();
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('rejects a new password that is not a string', async () => {
      const result = await updateProfile('user-1', {
        currentPassword: 'old-password-1',
        newPassword: 12345678,
      });

      expect(result).toEqual({
        ok: false,
        code: 'invalid',
        message: 'Nieprawidłowe hasło',
      });
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('treats an empty new password as no change and skips the current password check', async () => {
      const result = await updateProfile('user-1', {
        name: 'Anna Nowak',
        newPassword: '',
      });

      expect(result.ok).toBe(true);
      expect(mockBcryptCompare).not.toHaveBeenCalled();
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        id: 'user-1',
        name: 'Anna Nowak',
      });
    });
  });

  describe('not found and failures', () => {
    it('returns not found when the user does not exist', async () => {
      mockFindUserById.mockResolvedValueOnce(null);

      const result = await updateProfile('user-1', { name: 'Anna' });

      expect(result).toEqual({
        ok: false,
        code: 'not-found',
        message: 'Nie znaleziono użytkownika',
      });
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('returns a failed result and logs the error when the update throws', async () => {
      const error = new Error('write failed');
      mockUpdateUserProfile.mockRejectedValueOnce(error);

      const result = await updateProfile('user-1', { name: 'Anna' });

      expect(result).toEqual({
        ok: false,
        code: 'failed',
        message: 'Nie udało się zaktualizować profilu',
      });
      expect(mockLog.error).toHaveBeenCalledWith(
        { error },
        'Nie udało się zaktualizować profilu'
      );
    });

    it('returns a failed result and writes nothing when the stored password cannot be compared', async () => {
      const error = new Error('bcrypt failure');
      mockBcryptCompare.mockRejectedValueOnce(error);

      const result = await updateProfile('user-1', {
        currentPassword: 'old-password-1',
        newPassword: 'new-password-1',
      });

      expect(result).toMatchObject({ ok: false, code: 'failed' });
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('returns a failed result when the user lookup throws', async () => {
      mockFindUserById.mockRejectedValueOnce(new Error('DB down'));

      const result = await updateProfile('user-1', { name: 'Anna' });

      expect(result).toMatchObject({ ok: false, code: 'failed' });
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });
  });

  it('logs the names of the requested fields and never their values', async () => {
    const changes: ProfileChanges = {
      name: 'Anna Nowak',
      currentPassword: 'old-password-1',
      newPassword: 'new-password-1',
    };

    await updateProfile('user-1', changes);

    expect(mockLog.info).toHaveBeenCalledWith(
      { userId: 'user-1', changes: ['name', 'password'] },
      'Profile update requested'
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      { userId: 'user-1', changes: ['name', 'password'] },
      'Profile updated successfully'
    );
    expectNoPersonalData(Object.values(mockLog), [
      'Anna Nowak',
      'old-password-1',
      'new-password-1',
    ]);
  });
});
