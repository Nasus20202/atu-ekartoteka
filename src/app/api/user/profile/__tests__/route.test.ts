import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

const { auth } = await import('@/auth');
const { prisma } = await import('@/lib/database/prisma');

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

describe('User Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/user/profile', () => {
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

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should update user name successfully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        ...mockUser,
        name: 'Updated Name',
      });

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'Updated Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { name: 'Updated Name' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      });
    });

    it('should set name to null when empty string provided', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        ...mockUser,
        name: null,
      });

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: '' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBeNull();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { name: null },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      });
    });

    it('should require current password when changing password', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ newPassword: 'newPassword123' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Current password is required to change password'
      );
    });

    it('should reject incorrect current password', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      const { PATCH } = await import('../route');
      const request = createMockRequest({
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Current password is incorrect');
    });

    it('should update password with correct current password', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        ...mockUser,
        password: bcrypt.hashSync('newPassword123', 10),
      });

      const { PATCH } = await import('../route');
      const request = createMockRequest({
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalled();
      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'user-id' });
      expect(updateCall.data).toHaveProperty('password');
    });

    it('should update both name and password together', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        ...mockUser,
        name: 'New Name',
        password: bcrypt.hashSync('newPassword123', 10),
      });

      const { PATCH } = await import('../route');
      const request = createMockRequest({
        name: 'New Name',
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('New Name');
      expect(prisma.user.update).toHaveBeenCalled();
      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('name', 'New Name');
      expect(updateCall.data).toHaveProperty('password');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
        new Error('Database error')
      );

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update profile');
    });

    it('should not return password in response', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        name: 'Updated Name',
        role: mockUser.role,
        status: mockUser.status,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      } as any);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'Updated Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).not.toHaveProperty('password');
    });

    it('should hash new password before storing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        ...mockUser,
      });

      const { PATCH } = await import('../route');
      const request = createMockRequest({
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      });

      await PATCH(request);

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
      const hashedPassword = updateCall.data.password as string;

      expect(hashedPassword).not.toBe('newPassword123');
      expect(hashedPassword.startsWith('$2')).toBe(true);
      expect(await bcrypt.compare('newPassword123', hashedPassword)).toBe(true);
    });
  });
});
