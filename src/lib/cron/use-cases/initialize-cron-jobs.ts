import { cleanupExpiredPasswordResets } from '@/lib/cron/jobs/cleanup-password-resets';
import { cleanupExpiredVerifications } from '@/lib/cron/jobs/cleanup-verifications';
import { cleanupExpiredVoteConfirmations } from '@/lib/cron/jobs/cleanup-vote-confirmations';
import { getCronScheduler } from '@/lib/cron/runtime/scheduler';
import { createLogger } from '@/lib/platform/logging/logger';

const logger = createLogger('cron:init');

/**
 * Initialize all cron jobs
 * This should be called once when the server starts
 */
export function initializeCronJobs(): void {
  const scheduler = getCronScheduler();

  // Schedule cleanup job - runs every hour
  scheduler.scheduleTask(
    'cleanup-verifications',
    '0 * * * *', // Every hour
    cleanupExpiredVerifications
  );

  // Schedule password reset cleanup - runs every hour
  scheduler.scheduleTask(
    'cleanup-password-resets',
    '0 * * * *', // Every hour
    cleanupExpiredPasswordResets
  );

  // Pending vote ballots whose emailed code expired - runs every hour
  scheduler.scheduleTask(
    'cleanup-vote-confirmations',
    '0 * * * *', // Every hour
    cleanupExpiredVoteConfirmations
  );

  logger.info('Cron jobs initialized');
}

/**
 * Stop all cron jobs
 * Call this when shutting down the application
 */
export function stopCronJobs(): void {
  const scheduler = getCronScheduler();
  scheduler.stopAll();
  logger.info('Cron jobs stopped');
}
