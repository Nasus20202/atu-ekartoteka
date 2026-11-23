import { deleteVerificationById } from '@/lib/auth/mutations/delete-verification-codes';
import { createLogger } from '@/lib/platform/logging/logger';

const logger = createLogger('action:verification');

/**
 * Removes a code that never reached the user, so the resend rate limit does not
 * block a retry. A failed cleanup is logged so it cannot hide the send failure.
 */
export async function discardUnsentVerification(
  verificationId: string,
  userId: string
): Promise<void> {
  try {
    await deleteVerificationById(verificationId);
  } catch (error) {
    logger.error(
      { error, userId },
      'Failed to remove unsent verification code'
    );
  }
}
