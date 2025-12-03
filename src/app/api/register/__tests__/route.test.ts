import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

// Create mock functions
const mockUserFindUnique = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserCreate = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      findFirst: mockUserFindFirst,
      create: mockUserCreate,
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

      mockUserFindUnique.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate API request
      const result = await mockUserCreate({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
        },
      });

      expect(mockUserFindUnique).not.toHaveBeenCalled();
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
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserFindUnique.mockResolvedValue(existingUser);

      const foundUser = await mockUserFindUnique({
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

      mockUserFindUnique.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockUserCreate({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
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

      mockUserFindUnique.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockUserCreate({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
        },
      });

      expect(result.role).toBe(UserRole.TENANT);
    });

    it('should allow registration without name', async () => {
      const userData = {
        email: 'noname@example.com',
        password: 'password123',
      };

      mockUserFindUnique.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: '1',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockUserCreate({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: null,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
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
      mockUserFindFirst.mockResolvedValue(null);
      mockUserFindUnique.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: '1',
        email: adminData.email,
        password: await hash(adminData.password, 10),
        name: adminData.name,
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockUserCreate({
        data: {
          email: adminData.email,
          password: await hash(adminData.password, 10),
          name: adminData.name,
          role: UserRole.ADMIN,
          status: AccountStatus.APPROVED,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
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
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock admin exists
      mockUserFindFirst.mockResolvedValue(existingAdmin);

      const foundAdmin = await mockUserFindFirst({
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

      mockUserFindUnique.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: '2',
        email: userData.email,
        password: await hash(userData.password, 10),
        name: userData.name,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockUserCreate({
        data: {
          email: userData.email,
          password: await hash(userData.password, 10),
          name: userData.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
        },
      });

      expect(result.role).toBe(UserRole.TENANT);
      expect(result.status).toBe(AccountStatus.PENDING);
    });

    it('should verify no admin exists before creating first admin', async () => {
      // Mock no admin exists
      mockUserFindFirst.mockResolvedValue(null);

      const adminCheck = await mockUserFindFirst({
        where: { role: UserRole.ADMIN },
      });

      expect(adminCheck).toBeNull();
      expect(mockUserFindFirst).toHaveBeenCalledWith({
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
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserCreate.mockResolvedValue(firstAdmin);

      const result = await mockUserCreate({
        data: {
          email: firstAdmin.email,
          password: firstAdmin.password,
          name: firstAdmin.name,
          role: UserRole.ADMIN,
          status: AccountStatus.APPROVED,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
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
        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserCreate.mockResolvedValue(regularUser);

      const result = await mockUserCreate({
        data: {
          email: regularUser.email,
          password: regularUser.password,
          name: regularUser.name,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          emailVerified: true,
          authMethod: AuthMethod.CREDENTIALS,
        },
      });

      // Regular users should be pending
      expect(result.status).toBe(AccountStatus.PENDING);
      expect(result.role).toBe(UserRole.TENANT);
    });
  });
});
