import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDeleteExpiredVerifications, mockLogger } = vi.hoisted(() => ({
  mockDeleteExpiredVerifications: vi.fn(),
  mockLogger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock(
  '@/lib/mutations/email-verification/delete-expired-verifications',
  () => ({ deleteExpiredVerifications: mockDeleteExpiredVerifications })
);
vi.mock('@/lib/logger', () => ({ createLogger: () => mockLogger }));

import { cleanupExpiredVerifications } from '@/lib/cron/jobs/cleanup-verifications';

describe('cleanupExpiredVerifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes expired verifications and logs the count', async () => {
    mockDeleteExpiredVerifications.mockResolvedValue({ count: 3 });

    await cleanupExpiredVerifications();

    expect(mockLogger.info).toHaveBeenCalledWith(
      { deletedCount: 3 },
      'Cleaned up expired verification codes'
    );
  });

  it('logs and rethrows failures', async () => {
    const error = new Error('db down');
    mockDeleteExpiredVerifications.mockRejectedValue(error);

    await expect(cleanupExpiredVerifications()).rejects.toBe(error);
    expect(mockLogger.error).toHaveBeenCalledWith(
      { error },
      'Failed to clean up verification codes'
    );
  });
});
