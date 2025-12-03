import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
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

function createMockRequest(body: unknown): NextRequest {
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
      mockAuth.mockResolvedValueOnce(null);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(null);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
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

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'Updated Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
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
        },
      });
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

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: '' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
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
        },
      });
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
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);

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

      const { PATCH } = await import('../route');
      const request = createMockRequest({
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
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

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update profile');
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

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'Updated Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
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

      const { PATCH } = await import('../route');
      const request = createMockRequest({
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      });

      await PATCH(request);

      const updateCall = mockUserUpdate.mock.calls[0][0];
      const hashedPassword = updateCall.data.password as string;

      expect(hashedPassword).not.toBe('newPassword123');
      expect(hashedPassword.startsWith('$2')).toBe(true);
      expect(await bcrypt.compare('newPassword123', hashedPassword)).toBe(true);
    });
  });
});
