import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cron:cleanup-password-resets');

/**
 * Clean up expired or used password reset tokens
 */
export async function cleanupExpiredPasswordResets(): Promise<void> {
  try {
    const now = new Date();

    // Delete expired or used tokens
    const result = await prisma.passwordReset.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: now,
            },
          },
          {
            used: true,
          },
        ],
      },
    });

    logger.info(
      { deletedCount: result.count, timestamp: now.toISOString() },
      'Cleaned up expired or used password reset tokens'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup expired password reset tokens');
    throw error;
  }
}
