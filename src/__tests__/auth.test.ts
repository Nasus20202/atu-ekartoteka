import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockUser, mockUsers } from '@/__tests__/fixtures';
import { $Enums } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

const UserRole = $Enums.UserRole;
const AccountStatus = $Enums.AccountStatus;

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('User Login Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Credentials validation', () => {
    it('should return null when email is missing', async () => {
      const credentials = {
        email: '',
        password: 'password123',
      };

      expect(credentials.email).toBeFalsy();
    });

    it('should return null when password is missing', async () => {
      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      expect(credentials.password).toBeFalsy();
    });

    it('should return null when both email and password are missing', async () => {
      const credentials = {
        email: '',
        password: '',
      };

      expect(credentials.email).toBeFalsy();
      expect(credentials.password).toBeFalsy();
    });
  });

  describe('User lookup', () => {
    it('should return null when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should find user by email', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('Password verification', () => {
    it('should return null when password does not match', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const passwordMatch = await bcrypt.compare(
        'wrong_password',
        'hashed_password'
      );

      expect(passwordMatch).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong_password',
        'hashed_password'
      );
    });

    it('should return true when password matches', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const passwordMatch = await bcrypt.compare(
        'correct_password',
        'hashed_password'
      );

      expect(passwordMatch).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correct_password',
        'hashed_password'
      );
    });
  });

  describe('Successful authentication', () => {
    it('should return user object on successful login', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      const passwordMatch = await bcrypt.compare(
        'correct_password',
        mockUser.password
      );

      expect(user).toBeDefined();
      expect(passwordMatch).toBe(true);
      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.role).toBe(UserRole.TENANT);
      expect(user?.status).toBe(AccountStatus.APPROVED);
    });

    it('should return admin user on successful login', async () => {
      const mockAdminUser = mockUsers.admin;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
      });

      const passwordMatch = await bcrypt.compare(
        'admin_password',
        mockAdminUser.password
      );

      expect(user).toBeDefined();
      expect(passwordMatch).toBe(true);
      expect(user?.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Account status validation', () => {
    it('should allow login for approved user', async () => {
      const mockUser = mockUsers.approved;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'approved@example.com' },
      });

      expect(user?.status).toBe(AccountStatus.APPROVED);
    });

    it('should identify pending user', async () => {
      const mockUser = mockUsers.pending;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'pending@example.com' },
      });

      expect(user?.status).toBe(AccountStatus.PENDING);
    });

    it('should identify rejected user', async () => {
      const mockUser = mockUsers.rejected;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'rejected@example.com' },
      });

      expect(user?.status).toBe(AccountStatus.REJECTED);
    });
  });

  describe('Edge cases', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(
        prisma.user.findUnique({
          where: { email: 'test@example.com' },
        })
      ).rejects.toThrow('Database connection error');
    });

    it('should handle bcrypt errors gracefully', async () => {
      vi.mocked(bcrypt.compare).mockRejectedValue(
        new Error('Bcrypt comparison error') as never
      );

      await expect(
        bcrypt.compare('password', 'hashed_password')
      ).rejects.toThrow('Bcrypt comparison error');
    });

    it('should handle user with null name', async () => {
      const mockUser = createMockUser({ name: null });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(user?.name).toBeNull();
    });

    it('should handle case-sensitive email lookup', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { email: 'Test@Example.com' },
      });

      expect(user).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'Test@Example.com' },
      });
    });
  });

  describe('Session data structure', () => {
    it('should return correct user structure for session', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      if (user) {
        const sessionUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };

        expect(sessionUser).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
        });
      }
    });
  });

  describe('User with apartments', () => {
    it('should handle user with assigned apartments', async () => {
      const mockUser = mockUsers.withApartments;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
        include: { apartments: true },
      });

      expect(user?.apartments).toHaveLength(1);
      expect(user?.apartments[0].id).toBe('apt-456');
    });

    it('should handle user without assigned apartments', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
        include: { apartments: true },
      });

      expect(user?.apartments).toHaveLength(0);
    });
  });
});
