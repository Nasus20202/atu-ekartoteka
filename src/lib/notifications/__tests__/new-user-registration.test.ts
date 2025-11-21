import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notifyAdminsOfNewUser } from '@/lib/notifications/new-user-registration';

// Mock dependencies
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email/email-service', () => ({
  getEmailService: vi.fn(() => ({
    sendNewUserNotificationToAdmin: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

const { prisma } = await import('@/lib/database/prisma');
const { getEmailService } = await import('@/lib/email/email-service');

describe('notifyAdminsOfNewUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send notification to all admin users', async () => {
    const mockAdmins = [
      { email: 'admin1@example.com', name: 'Admin One' },
      { email: 'admin2@example.com', name: 'Admin Two' },
      { email: 'admin3@example.com', name: 'Admin Three' },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockAdmins as any);

    const mockEmailService = {
      sendNewUserNotificationToAdmin: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(getEmailService).mockReturnValue(mockEmailService as any);

    await notifyAdminsOfNewUser(
      'newuser@example.com',
      'New User',
      new Date('2024-01-15T10:30:00')
    );

    expect(
      mockEmailService.sendNewUserNotificationToAdmin
    ).toHaveBeenCalledTimes(3);
    expect(
      mockEmailService.sendNewUserNotificationToAdmin
    ).toHaveBeenCalledWith(
      'admin1@example.com',
      'newuser@example.com',
      'New User',
      expect.any(String)
    );
  });

  it('should handle case when no admins exist', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    // Should not throw
    await expect(
      notifyAdminsOfNewUser('newuser@example.com', 'New User', new Date())
    ).resolves.toBeUndefined();
  });

  it('should format registration date in Polish locale', async () => {
    const mockAdmins = [{ email: 'admin@example.com', name: 'Admin' }];

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockAdmins as any);

    const mockEmailService = {
      sendNewUserNotificationToAdmin: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(getEmailService).mockReturnValue(mockEmailService as any);

    const testDate = new Date('2024-01-15T14:30:00');
    await notifyAdminsOfNewUser('newuser@example.com', 'New User', testDate);

    expect(
      mockEmailService.sendNewUserNotificationToAdmin
    ).toHaveBeenCalledWith(
      'admin@example.com',
      'newuser@example.com',
      'New User',
      expect.stringContaining('2024')
    );
  });

  it('should continue if one admin notification fails', async () => {
    const mockAdmins = [
      { email: 'admin1@example.com', name: 'Admin One' },
      { email: 'admin2@example.com', name: 'Admin Two' },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockAdmins as any);

    const mockEmailService = {
      sendNewUserNotificationToAdmin: vi
        .fn()
        .mockResolvedValueOnce(false) // First fails
        .mockResolvedValueOnce(true), // Second succeeds
    };
    vi.mocked(getEmailService).mockReturnValue(mockEmailService as any);

    // Should not throw
    await expect(
      notifyAdminsOfNewUser('newuser@example.com', 'New User', new Date())
    ).resolves.toBeUndefined();

    expect(
      mockEmailService.sendNewUserNotificationToAdmin
    ).toHaveBeenCalledTimes(2);
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(
      new Error('Database error')
    );

    // Should not throw
    await expect(
      notifyAdminsOfNewUser('newuser@example.com', 'New User', new Date())
    ).resolves.toBeUndefined();
  });

  it('should query only admin users', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    await notifyAdminsOfNewUser('newuser@example.com', 'New User', new Date());

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        role: 'ADMIN',
      },
      select: {
        email: true,
        name: true,
      },
    });
  });
});
