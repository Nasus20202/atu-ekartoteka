import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/database/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

// Mock the prisma client
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock the logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  createLogger: () => mockLogger,
}));

describe('Setup Check Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/setup/check', () => {
    it('should return needsSetup true when no admin exists', async () => {
      // Mock no admin found
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsSetup).toBe(true);
      expect(data.hasAdmin).toBe(false);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
    });

    it('should return needsSetup false when admin exists', async () => {
      // Mock admin found
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: 'admin-id',
        email: 'admin@example.com',
        password: 'hashed',
        name: 'Admin User',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        authMethod: 'CREDENTIALS' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsSetup).toBe(false);
      expect(data.hasAdmin).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.mocked(prisma.user.findFirst).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to check setup status');
    });

    it('should return correct response schema with both required fields', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('needsSetup');
      expect(data).toHaveProperty('hasAdmin');
      expect(typeof data.needsSetup).toBe('boolean');
      expect(typeof data.hasAdmin).toBe('boolean');
      expect(Object.keys(data).length).toBe(2);
    });

    it('should return needsSetup false with multiple admins', async () => {
      // Mock admin found (even if multiple exist, findFirst returns one)
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin1@example.com',
        password: 'hashed',
        name: 'First Admin',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        authMethod: 'CREDENTIALS' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(data.needsSetup).toBe(false);
      expect(data.hasAdmin).toBe(true);
    });

    it('should log info when admin exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: 'admin-id',
        email: 'admin@example.com',
        password: 'hashed',
        name: 'Admin User',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        authMethod: 'CREDENTIALS' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { GET } = await import('../check/route');
      await GET();

      expect(mockLogger.info).toHaveBeenCalledWith(
        { adminExists: true },
        'Checked if admin user exists'
      );
    });

    it('should log info when no admin exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const { GET } = await import('../check/route');
      await GET();

      expect(mockLogger.info).toHaveBeenCalledWith(
        { adminExists: false },
        'Checked if admin user exists'
      );
    });

    it('should log error when database query fails', async () => {
      const dbError = new Error('Connection timeout');
      vi.mocked(prisma.user.findFirst).mockRejectedValueOnce(dbError);

      const { GET } = await import('../check/route');
      await GET();

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: dbError },
        'Failed to check admin existence'
      );
    });

    it('should use correct database query structure', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const { GET } = await import('../check/route');
      await GET();

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
    });

    it('should handle null response from database', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsSetup).toBe(true);
      expect(data.hasAdmin).toBe(false);
    });

    it('should return 200 status for successful checks', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const { GET } = await import('../check/route');
      const response = await GET();

      expect(response.status).toBe(200);
    });

    it('should handle admin with PENDING status', async () => {
      // Admin with PENDING status should still count as admin exists
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: 'admin-id',
        email: 'admin@example.com',
        password: 'hashed',
        name: 'Admin User',
        role: UserRole.ADMIN,
        status: AccountStatus.PENDING,
        emailVerified: true,
        authMethod: 'CREDENTIALS' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(data.needsSetup).toBe(false);
      expect(data.hasAdmin).toBe(true);
    });

    it('should handle admin with REJECTED status', async () => {
      // Admin with REJECTED status should still count as admin exists
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: 'admin-id',
        email: 'admin@example.com',
        password: 'hashed',
        name: 'Admin User',
        role: UserRole.ADMIN,
        status: AccountStatus.REJECTED,
        emailVerified: true,
        authMethod: 'CREDENTIALS' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(data.needsSetup).toBe(false);
      expect(data.hasAdmin).toBe(true);
    });

    it('should handle different database error types', async () => {
      const errors = [
        new Error('Network error'),
        new Error('Timeout'),
        { message: 'Unknown error' },
      ];

      for (const error of errors) {
        vi.clearAllMocks();
        vi.mocked(prisma.user.findFirst).mockRejectedValueOnce(error);

        const { GET } = await import('../check/route');
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to check setup status');
      }
    });

    it('should maintain consistent response structure on error', async () => {
      vi.mocked(prisma.user.findFirst).mockRejectedValueOnce(
        new Error('Database error')
      );

      const { GET } = await import('../check/route');
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
      expect(data).not.toHaveProperty('needsSetup');
      expect(data).not.toHaveProperty('hasAdmin');
    });
  });
});
