import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';

const logger = createLogger('notifications:account-status');

/**
 * Send notification when account status changes to APPROVED
 */
export async function notifyAccountApproved(
  email: string,
  name?: string | null
): Promise<void> {
  try {
    const emailService = getEmailService();
    const result = await emailService.sendAccountApprovedEmail(
      email,
      name || undefined
    );

    if (result.ok) {
      logger.info('Account approved notification sent');
    } else {
      logger.error(
        { reason: result.reason },
        'Failed to send account approved notification'
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to send account approved notification');
    // Don't throw - notification failure shouldn't break the approval process
  }
}
