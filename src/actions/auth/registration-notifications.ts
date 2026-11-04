import { getEmailService } from '@/lib/email/email-service';
import {
  generateSecureToken,
  getVerificationExpiration,
  hashToken,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { createEmailVerification } from '@/lib/mutations/email-verification/create-verification';
import { notifyAdminsOfNewUser } from '@/lib/notifications/new-user-registration';

const logger = createLogger('action:register');

const VERIFICATION_EXPIRY_HOURS = 24;
const NO_NAME_LABEL = 'Brak imienia';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

/** Stores a hashed verification token and emails the plain one. */
export async function sendRegistrationVerification(
  user: RegisteredUser
): Promise<void> {
  try {
    const verificationToken = generateSecureToken();

    await createEmailVerification({
      userId: user.id,
      hashedCode: hashToken(verificationToken),
      expiresAt: getVerificationExpiration(VERIFICATION_EXPIRY_HOURS),
    });

    await getEmailService().sendVerificationEmail(
      user.email,
      verificationToken,
      user.name || undefined
    );

    logger.info(
      { email: user.email, userId: user.id },
      'Verification email sent'
    );
  } catch (error) {
    // Registration still succeeds; the user can request a new email later.
    logger.error(
      { error, email: user.email },
      'Failed to send verification email'
    );
  }
}

/** Tells the admins about a new pending account; failures are only logged. */
export async function notifyAdminsAboutRegistration(
  user: RegisteredUser
): Promise<void> {
  try {
    await notifyAdminsOfNewUser(
      user.email,
      user.name || NO_NAME_LABEL,
      user.createdAt
    );
  } catch (error) {
    logger.error(
      { error, email: user.email },
      'Failed to notify admins of new user'
    );
  }
}
