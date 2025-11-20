import { describe, expect, it, vi } from 'vitest';

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
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Setup Check Endpoint', () => {
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
  });
});
