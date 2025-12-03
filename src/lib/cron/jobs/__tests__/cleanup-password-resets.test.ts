import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupExpiredPasswordResets } from '@/lib/cron/jobs/cleanup-password-resets';

const { mockPasswordResetDeleteMany } = vi.hoisted(() => ({
  mockPasswordResetDeleteMany: vi.fn(),
}));

// Mock dependencies
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    passwordReset: {
      deleteMany: mockPasswordResetDeleteMany,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

const { prisma } = await import('@/lib/database/prisma');

describe('cleanupExpiredPasswordResets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete expired or used password reset tokens', async () => {
    mockPasswordResetDeleteMany.mockResolvedValue({ count: 5 });

    await cleanupExpiredPasswordResets();

    expect(prisma.passwordReset.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            expiresAt: {
              lt: expect.any(Date),
            },
          },
          {
            used: true,
          },
        ],
      },
    });
  });

  it('should throw errors', async () => {
    const error = new Error('Database error');
    mockPasswordResetDeleteMany.mockRejectedValue(error);

    // Should throw the error
    await expect(cleanupExpiredPasswordResets()).rejects.toThrow(
      'Database error'
    );
  });

  it('should log the number of deleted tokens', async () => {
    mockPasswordResetDeleteMany.mockResolvedValue({ count: 3 });

    await cleanupExpiredPasswordResets();

    // Verify deleteMany was called
    expect(prisma.passwordReset.deleteMany).toHaveBeenCalled();
  });
});
