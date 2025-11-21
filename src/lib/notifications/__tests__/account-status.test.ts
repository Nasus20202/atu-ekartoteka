import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notifyAccountApproved } from '@/lib/notifications/account-status';

// Mock dependencies
vi.mock('@/lib/email/email-service', () => ({
  getEmailService: vi.fn(() => ({
    sendAccountApprovedEmail: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

const { getEmailService } = await import('@/lib/email/email-service');

describe('notifyAccountApproved', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send account approved email', async () => {
    const mockEmailService = {
      sendAccountApprovedEmail: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(getEmailService).mockReturnValue(mockEmailService as any);

    await notifyAccountApproved('test@example.com', 'Test User');

    expect(mockEmailService.sendAccountApprovedEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Test User'
    );
  });

  it('should handle null name', async () => {
    const mockEmailService = {
      sendAccountApprovedEmail: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(getEmailService).mockReturnValue(mockEmailService as any);

    await notifyAccountApproved('test@example.com', null);

    expect(mockEmailService.sendAccountApprovedEmail).toHaveBeenCalledWith(
      'test@example.com',
      undefined
    );
  });

  it('should handle errors gracefully without throwing', async () => {
    const mockEmailService = {
      sendAccountApprovedEmail: vi
        .fn()
        .mockRejectedValue(new Error('Email error')),
    };
    vi.mocked(getEmailService).mockReturnValue(mockEmailService as any);

    // Should not throw
    await expect(
      notifyAccountApproved('test@example.com', 'Test User')
    ).resolves.toBeUndefined();
  });

  it('should log success when email is sent', async () => {
    const mockEmailService = {
      sendAccountApprovedEmail: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(getEmailService).mockReturnValue(mockEmailService as any);

    await notifyAccountApproved('test@example.com', 'Test User');

    expect(mockEmailService.sendAccountApprovedEmail).toHaveBeenCalled();
  });
});
