import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockScheduler } = vi.hoisted(() => ({
  mockScheduler: { scheduleTask: vi.fn(), stopAll: vi.fn() },
}));

vi.mock('@/lib/cron/runtime/scheduler', () => ({
  getCronScheduler: () => mockScheduler,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn() }),
}));

import { cleanupExpiredPasswordResets } from '@/lib/cron/jobs/cleanup-password-resets';
import { cleanupExpiredVerifications } from '@/lib/cron/jobs/cleanup-verifications';
import {
  initializeCronJobs,
  stopCronJobs,
} from '@/lib/cron/use-cases/initialize-cron-jobs';

const EVERY_HOUR = '0 * * * *';

describe('cron init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('schedules the hourly cleanup jobs', () => {
    initializeCronJobs();

    expect(mockScheduler.scheduleTask.mock.calls).toEqual([
      ['cleanup-verifications', EVERY_HOUR, cleanupExpiredVerifications],
      ['cleanup-password-resets', EVERY_HOUR, cleanupExpiredPasswordResets],
    ]);
  });

  it('stops all jobs', () => {
    stopCronJobs();

    expect(mockScheduler.stopAll).toHaveBeenCalledOnce();
  });
});
