import { createLogger } from '@/lib/logger';
import { deleteExpiredPasswordResets } from '@/lib/mutations/password-reset/delete-expired-password-resets';

const logger = createLogger('cron:cleanup-password-resets');

/**
 * Clean up expired or used password reset tokens
 */
export async function cleanupExpiredPasswordResets(): Promise<void> {
  try {
    const result = await deleteExpiredPasswordResets();

    logger.info(
      { deletedCount: result.count, timestamp: new Date().toISOString() },
      'Cleaned up expired or used password reset tokens'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup expired password reset tokens');
    throw error;
  }
}
