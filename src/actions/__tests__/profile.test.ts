import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

// Create mock functions
const mockAuth = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// The data of a successful result, or the failure itself
function dataOf(result: { ok: boolean }) {
  const value = result as any;
  return value.ok ? value.data : value;
}

describe('updateProfileAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('profile changes', () => {
    const mockUser = {
      id: 'user-id',
      email: 'user@example.com',
      password: bcrypt.hashSync('currentPassword123', 10),
      name: 'Test User',
      role: UserRole.TENANT,
      status: AccountStatus.APPROVED,
      emailVerified: true,
      authMethod: AuthMethod.CREDENTIALS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an unauthenticated result when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { name: 'New Name' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'unauthenticated' });
      expect(data.error).toBe('Musisz być zalogowany');
    });

    it('should return a not-found result when user not found', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(null);

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { name: 'New Name' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'not-found' });
      expect(data.error).toBe('Nie znaleziono użytkownika');
    });

    it('should update user name successfully', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      mockUserUpdate.mockResolvedValueOnce({
        ...mockUser,
        name: 'Updated Name',
      });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { name: 'Updated Name' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result.ok).toBe(true);
      expect(data.name).toBe('Updated Name');
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { name: 'Updated Name' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(data.createdAt).toBeTypeOf('string');
      expect(data.updatedAt).toBeTypeOf('string');
    });

    it('should set name to null when empty string provided', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      mockUserUpdate.mockResolvedValueOnce({
        ...mockUser,
        name: null,
      });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { name: '' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result.ok).toBe(true);
      expect(data.name).toBeNull();
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { name: null },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(data.createdAt).toBeTypeOf('string');
      expect(data.updatedAt).toBeTypeOf('string');
    });

    it('should require current password when changing password', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { newPassword: 'newPassword123' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Obecne hasło jest wymagane aby zmienić hasło');
    });

    it('should reject incorrect current password', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);

      const { updateProfileAction } = await import('@/actions/profile');
      const input = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Obecne hasło jest nieprawidłowe');
    });

    it('should reject a new password shorter than 8 characters', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-id' } });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);

      const { updateProfileAction } = await import('@/actions/profile');
      const result = await updateProfileAction({ newPassword: 'short' });
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Hasło musi mieć co najmniej 8 znaków');
    });

    it('should reject a password change for a user without a password', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-id' } });
      mockUserFindUnique.mockResolvedValueOnce({ ...mockUser, password: null });

      const { updateProfileAction } = await import('@/actions/profile');
      const result = await updateProfileAction({
        currentPassword: 'anything',
        newPassword: 'newPassword123',
      });
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Obecne hasło jest nieprawidłowe');
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it('should update password with correct current password', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      mockUserUpdate.mockResolvedValueOnce({
        ...mockUser,
        password: bcrypt.hashSync('newPassword123', 10),
      });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      };

      const result = await updateProfileAction(input);

      expect(result.ok).toBe(true);
      expect(mockUserUpdate).toHaveBeenCalled();
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'user-id' });
      expect(updateCall.data).toHaveProperty('password');
    });

    it('should update both name and password together', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      mockUserUpdate.mockResolvedValueOnce({
        ...mockUser,
        name: 'New Name',
        password: bcrypt.hashSync('newPassword123', 10),
      });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = {
        name: 'New Name',
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result.ok).toBe(true);
      expect(data.name).toBe('New Name');
      expect(mockUserUpdate).toHaveBeenCalled();
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('name', 'New Name');
      expect(updateCall.data).toHaveProperty('password');
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockRejectedValueOnce(new Error('Database error'));

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { name: 'New Name' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'failed' });
      expect(data.error).toBe('Nie udało się zaktualizować profilu');
    });

    it('should not return password in response', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      mockUserUpdate.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        name: 'Updated Name',
        role: mockUser.role,
        status: mockUser.status,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { name: 'Updated Name' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result.ok).toBe(true);
      expect(data).not.toHaveProperty('password');
    });

    it('should hash new password before storing', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      mockUserUpdate.mockResolvedValueOnce({
        ...mockUser,
      });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      };

      await updateProfileAction(input);

      const updateCall = mockUserUpdate.mock.calls[0][0];
      const hashedPassword = updateCall.data.password as string;

      expect(hashedPassword).not.toBe('newPassword123');
      expect(hashedPassword.startsWith('$2')).toBe(true);
      expect(await bcrypt.compare('newPassword123', hashedPassword)).toBe(true);
    });
    it('should set mustChangePassword to false when password is changed', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
          mustChangePassword: false,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      mockUserUpdate.mockResolvedValueOnce({ ...mockUser });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      };

      const result = await updateProfileAction(input);

      expect(result.ok).toBe(true);
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('mustChangePassword', false);
    });

    it('should allow password change without currentPassword when mustChangePassword is true', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
          mustChangePassword: true,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce({
        ...mockUser,
        mustChangePassword: true,
      });
      mockUserUpdate.mockResolvedValueOnce({ ...mockUser });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = {
        newPassword: 'newPassword123',
        // no currentPassword
      };

      const result = await updateProfileAction(input);

      expect(result.ok).toBe(true);
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('mustChangePassword', false);
      expect(updateCall.data).toHaveProperty('password');
    });

    it('should ignore a stale mustChangePassword flag from the session token', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
          mustChangePassword: true,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce({
        ...mockUser,
        mustChangePassword: false,
      });

      const { updateProfileAction } = await import('@/actions/profile');
      const input = { newPassword: 'newPassword123' };

      const result = await updateProfileAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Obecne hasło jest wymagane aby zmienić hasło');
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });
  });
});
