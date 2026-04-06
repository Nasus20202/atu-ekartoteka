import { createLogger } from '@/lib/logger';
import { deleteExpiredVerifications } from '@/lib/mutations/email-verification/delete-expired-verifications';

const logger = createLogger('cron:cleanup-verifications');

/**
 * Clean up expired email verification codes
 * Removes verification codes that have expired and are not verified
 */
export async function cleanupExpiredVerifications(): Promise<void> {
  try {
    const result = await deleteExpiredVerifications();

    logger.info(
      { deletedCount: result.count },
      'Cleaned up expired verification codes'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to clean up verification codes');
    throw error;
  }
}
