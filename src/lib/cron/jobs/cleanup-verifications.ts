import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cron:cleanup-verifications');

/**
 * Clean up expired email verification codes
 * Removes verification codes that have expired and are not verified
 */
export async function cleanupExpiredVerifications(): Promise<void> {
  try {
    // Delete expired or verified codes
    const result = await prisma.emailVerification.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            verified: true,
          },
        ],
      },
    });

    logger.info(
      { deletedCount: result.count },
      'Cleaned up expired verification codes'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to clean up verification codes');
    throw error;
  }
}
