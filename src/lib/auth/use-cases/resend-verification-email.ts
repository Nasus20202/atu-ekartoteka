import { createEmailVerification } from '@/lib/auth/mutations/create-verification';
import { deleteVerificationsForUser } from '@/lib/auth/mutations/delete-verifications-for-user';
import {
  findRecentVerification,
  RATE_LIMIT_WINDOW_MS,
} from '@/lib/auth/queries/find-recent-verification';
import {
  generateSecureToken,
  getVerificationExpiration,
  hashToken,
} from '@/lib/auth/rules/verification-tokens';
import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  notFoundResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { findUserById } from '@/lib/users/queries/find-user-by-id';

const logger = createLogger('action:verification');

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const USER_NOT_FOUND_MESSAGE = 'Użytkownik nie znaleziony';
const ALREADY_VERIFIED_MESSAGE = 'Email jest już zweryfikowany';
const SEND_FAILED_MESSAGE = 'Nie udało się wysłać emaila';
const RESENT_MESSAGE = 'Email weryfikacyjny został wysłany ponownie';

function minutesUntilNextResend(lastSentAt: Date): number {
  const msLeft = lastSentAt.getTime() + RATE_LIMIT_WINDOW_MS - Date.now();
  return Math.ceil(msLeft / MS_PER_SECOND / SECONDS_PER_MINUTE);
}

/** Replaces the user's verification code and emails it again, at most once per window. */
export async function resendVerificationEmail(
  userId: string
): Promise<UseCaseResult<{ message: string }>> {
  try {
    const user = await findUserById(userId);

    if (!user) return notFoundResult(USER_NOT_FOUND_MESSAGE);

    if (user.emailVerified) return invalidResult(ALREADY_VERIFIED_MESSAGE);

    const recent = await findRecentVerification(user.id);

    if (recent) {
      return failedResult(
        `Poczekaj ${minutesUntilNextResend(recent.createdAt)} min przed ponownym wysłaniem`
      );
    }

    await deleteVerificationsForUser(user.id);

    const token = generateSecureToken();
    await createEmailVerification({
      userId: user.id,
      hashedCode: hashToken(token),
      expiresAt: getVerificationExpiration(),
    });

    await getEmailService().sendVerificationEmail(
      user.email,
      token,
      user.name || undefined
    );

    logger.info({ userId: user.id }, 'Verification email resent');
    return { ok: true, data: { message: RESENT_MESSAGE } };
  } catch (error) {
    logger.error({ error }, 'Error resending verification email');
    return failedResult(SEND_FAILED_MESSAGE);
  }
}
