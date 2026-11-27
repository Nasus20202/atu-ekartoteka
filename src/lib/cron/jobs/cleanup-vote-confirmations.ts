import { createLogger } from '@/lib/platform/logging/logger';
import { deleteExpiredVoteConfirmations } from '@/lib/voting/mutations/delete-expired-vote-confirmations';

const logger = createLogger('cron:cleanup-vote-confirmations');

/** Removes pending ballots whose emailed code has expired. */
export async function cleanupExpiredVoteConfirmations(): Promise<void> {
  try {
    const result = await deleteExpiredVoteConfirmations();

    logger.info(
      { deletedCount: result.count },
      'Cleaned up expired vote confirmations'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to clean up vote confirmations');
    throw error;
  }
}
