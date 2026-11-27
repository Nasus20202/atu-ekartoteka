import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDelete, mockLogger } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockLogger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/voting/mutations/delete-expired-vote-confirmations', () => ({
  deleteExpiredVoteConfirmations: mockDelete,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLogger,
}));

import { cleanupExpiredVoteConfirmations } from '@/lib/cron/jobs/cleanup-vote-confirmations';

describe('cleanupExpiredVoteConfirmations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes expired confirmations and logs the count', async () => {
    mockDelete.mockResolvedValue({ count: 2 });

    await cleanupExpiredVoteConfirmations();

    expect(mockLogger.info).toHaveBeenCalledWith(
      { deletedCount: 2 },
      'Cleaned up expired vote confirmations'
    );
  });

  it('logs and rethrows failures', async () => {
    const error = new Error('db down');
    mockDelete.mockRejectedValue(error);

    await expect(cleanupExpiredVoteConfirmations()).rejects.toBe(error);
    expect(mockLogger.error).toHaveBeenCalledWith(
      { error },
      'Failed to clean up vote confirmations'
    );
  });
});
