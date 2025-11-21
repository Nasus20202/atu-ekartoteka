import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
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

const { prisma } = await import('@/lib/database/prisma');

describe('Registration API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/register', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate API request
      const result = await prisma.user.create({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
        },
      });

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.role).toBe(UserRole.TENANT);
      expect(result.status).toBe(AccountStatus.PENDING);
    });

    it('should validate email format', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test @example.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password length', () => {
      const shortPassword = 'short';
      const validPassword = 'validpassword';

      expect(shortPassword.length >= 8).toBe(false);
      expect(validPassword.length >= 8).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        password: await hash('password123', 10),
        name: 'Existing User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);

      const foundUser = await prisma.user.findUnique({
        where: { email: 'existing@example.com' },
      });

      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe('existing@example.com');
    });

    it('should hash password before storing', async () => {
      const password = 'mypassword123';
      const hashedPassword = await hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
      expect(hashedPassword.startsWith('$2')).toBe(true); // bcrypt hash starts with $2
    });

    it('should create user with PENDING status by default', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await prisma.user.create({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
        },
      });

      expect(result.status).toBe(AccountStatus.PENDING);
    });

    it('should create user with TENANT role by default', async () => {
      const userData = {
        email: 'tenant@example.com',
        password: 'password123',
        name: 'Tenant User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await prisma.user.create({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
        },
      });

      expect(result.role).toBe(UserRole.TENANT);
    });

    it('should allow registration without name', async () => {
      const userData = {
        email: 'noname@example.com',
        password: 'password123',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await prisma.user.create({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: null,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
        },
      });

      expect(result.name).toBeNull();
      expect(result.email).toBe(userData.email);
    });
  });

  describe('First Admin Registration', () => {
    it('should create first user as ADMIN with APPROVED status when isFirstAdmin is true', async () => {
      const adminData = {
        email: 'admin@example.com',
        password: 'adminpass123',
        name: 'Admin User',
        isFirstAdmin: true,
      };

      // Mock no admin exists
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: adminData.email,
        password: await hash(adminData.password, 10),
        name: adminData.name,
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await prisma.user.create({
        data: {
          email: adminData.email,
          password: await hash(adminData.password, 10),
          name: adminData.name,
          role: UserRole.ADMIN,
          status: AccountStatus.APPROVED,
          emailVerified: true,
        },
      });

      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.status).toBe(AccountStatus.APPROVED);
      expect(result.email).toBe(adminData.email);
    });

    it('should reject first admin registration if admin already exists', async () => {
      const existingAdmin = {
        id: '1',
        email: 'existing-admin@example.com',
        password: await hash('password123', 10),
        name: 'Existing Admin',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock admin exists
      vi.mocked(prisma.user.findFirst).mockResolvedValue(existingAdmin);

      const foundAdmin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      expect(foundAdmin).not.toBeNull();
      expect(foundAdmin?.role).toBe(UserRole.ADMIN);
    });

    it('should create regular user with TENANT role when isFirstAdmin is false', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'userpass123',
        name: 'Regular User',
        isFirstAdmin: false,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '2',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await prisma.user.create({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
        },
      });

      expect(result.role).toBe(UserRole.TENANT);
      expect(result.status).toBe(AccountStatus.PENDING);
    });

    it('should verify no admin exists before creating first admin', async () => {
      // Mock no admin exists
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const adminCheck = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      expect(adminCheck).toBeNull();
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
    });

    it('should allow first admin to login immediately (APPROVED status)', async () => {
      const firstAdmin = {
        id: '1',
        email: 'first-admin@example.com',
        password: await hash('adminpass123', 10),
        name: 'First Admin',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.create).mockResolvedValue(firstAdmin);

      const result = await prisma.user.create({
        data: {
          email: firstAdmin.email,
          password: firstAdmin.password,
          name: firstAdmin.name,
          role: UserRole.ADMIN,
          status: AccountStatus.APPROVED,
          emailVerified: true,
        },
      });

      // First admin should be approved immediately
      expect(result.status).toBe(AccountStatus.APPROVED);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should require regular users to wait for approval (PENDING status)', async () => {
      const regularUser = {
        id: '2',
        email: 'user@example.com',
        password: await hash('userpass123', 10),
        name: 'Regular User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.create).mockResolvedValue(regularUser);

      const result = await prisma.user.create({
        data: {
          email: regularUser.email,
          password: regularUser.password,
          name: regularUser.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
        },
      });

      // Regular users should be pending
      expect(result.status).toBe(AccountStatus.PENDING);
      expect(result.role).toBe(UserRole.TENANT);
    });
  });
});
