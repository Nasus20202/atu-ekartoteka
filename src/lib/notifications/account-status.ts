import { getEmailService } from '@/lib/email/email-service';
import { createLogger } from '@/lib/logger';

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
    await emailService.sendAccountApprovedEmail(email, name || undefined);

    logger.info({ email }, 'Account approved notification sent');
  } catch (error) {
    logger.error(
      { error, email },
      'Failed to send account approved notification'
    );
    // Don't throw - notification failure shouldn't break the approval process
  }
}
