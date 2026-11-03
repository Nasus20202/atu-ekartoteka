import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserCreate = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
  },
}));

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

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
  },
}));

// The data of a successful result, or the failure itself
function dataOf(result: { ok: boolean }) {
  const value = result as any;
  return value.ok ? value.data : value;
}

describe('createUserAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('creating a user', () => {
    it('should return an unauthenticated result when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'unauthenticated' });
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return a forbidden result when user is not admin', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'forbidden' });
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return an invalid result when email is missing', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = { password: 'password123' };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Email i hasło są wymagane');
    });

    it('should return an invalid result when password is missing', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = { email: 'test@example.com' };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Email i hasło są wymagane');
    });

    it('should return an invalid result when role is invalid', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
        role: 'INVALID_ROLE',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Nieprawidłowa rola');
    });

    it('should return an invalid result when status is invalid', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
        status: 'INVALID_STATUS',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Nieprawidłowy status konta');
    });

    it('should return an invalid result when user already exists', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'test@example.com',
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'invalid' });
      expect(data.error).toBe('Użytkownik z tym adresem email już istnieje');
    });

    it('should create user with default role and status', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as never);
      mockUserCreate.mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result.ok).toBe(true);
      expect(data.email).toBe('test@example.com');
      expect(data.role).toBe(UserRole.TENANT);
      expect(data.status).toBe(AccountStatus.PENDING);
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed_password',
          name: null,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          mustChangePassword: true,
        },
        select: expect.any(Object),
      });
    });

    it('should create user with specified role and status', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as never);
      mockUserCreate.mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result.ok).toBe(true);
      expect(data.role).toBe(UserRole.ADMIN);
      expect(data.status).toBe(AccountStatus.APPROVED);
      expect(data.name).toBe('Test User');
    });

    it('should hash password before storing', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as never);
      mockUserCreate.mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      await createUserAction(input);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        })
      );
    });

    it('should not return password in response', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as never);
      mockUserCreate.mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
      });

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(data).not.toHaveProperty('password');
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: expect.any(Object),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockRejectedValueOnce(new Error('Database error'));

      const { createUserAction } = await import('@/actions/users');
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await createUserAction(input);
      const data = dataOf(result);

      expect(result).toMatchObject({ ok: false, code: 'failed' });
      expect(data.error).toBe('Nie udało się utworzyć użytkownika');
    });
  });
});
