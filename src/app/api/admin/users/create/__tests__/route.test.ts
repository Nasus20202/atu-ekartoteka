import bcrypt from 'bcrypt';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
  },
}));

const { auth } = await import('@/auth');
const { prisma } = await import('@/lib/database/prisma');

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

describe('Admin Users Create API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/users/create', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when user is not admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when email is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({ password: 'password123' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('should return 400 when password is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({ email: 'test@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('should return 400 when role is invalid', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        role: 'INVALID_ROLE',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid role');
    });

    it('should return 400 when status is invalid', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        status: 'INVALID_STATUS',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid status');
    });

    it('should return 400 when user already exists', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'existing-user',
        email: 'test@example.com',
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
    });

    it('should create user with default role and status', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as any);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.email).toBe('test@example.com');
      expect(data.role).toBe(UserRole.TENANT);
      expect(data.status).toBe(AccountStatus.PENDING);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed_password',
          name: null,
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
        },
        select: expect.any(Object),
      });
    });

    it('should create user with specified role and status', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as any);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.role).toBe(UserRole.ADMIN);
      expect(data.status).toBe(AccountStatus.APPROVED);
      expect(data.name).toBe('Test User');
    });

    it('should hash password before storing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as any);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      await POST(request);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        })
      );
    });

    it('should not return password in response', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as any);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'test@example.com',
        name: null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).not.toHaveProperty('password');
      expect(prisma.user.create).toHaveBeenCalledWith({
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
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
        new Error('Database error')
      );

      const { POST } = await import('../route');
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create user');
    });
  });
});
