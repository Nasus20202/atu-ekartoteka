'use server';

import {
  type ActionResult,
  failed,
  invalid,
  notFound,
} from '@/actions/action-result';
import { requireUserAction } from '@/lib/auth/require-action';
import { getEmailService } from '@/lib/email/email-service';
import {
  generateSecureToken,
  getVerificationExpiration,
  hashToken,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { createEmailVerification } from '@/lib/mutations/email-verification/create-verification';
import { deleteVerificationsForUser } from '@/lib/mutations/email-verification/delete-verifications-for-user';
import {
  findRecentVerification,
  RATE_LIMIT_WINDOW_MS,
} from '@/lib/queries/email-verification/find-recent-verification';
import { findUserById } from '@/lib/queries/users/find-user-by-id';

const logger = createLogger('action:verification');

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

const USER_NOT_FOUND_MESSAGE = 'Użytkownik nie znaleziony';
const ALREADY_VERIFIED_MESSAGE = 'Email jest już zweryfikowany';
const SEND_FAILED_MESSAGE = 'Nie udało się wysłać emaila';

function minutesUntilNextResend(lastSentAt: Date): number {
  const msLeft = lastSentAt.getTime() + RATE_LIMIT_WINDOW_MS - Date.now();
  return Math.ceil(msLeft / MS_PER_SECOND / SECONDS_PER_MINUTE);
}

export async function resendVerificationAction(): Promise<
  ActionResult<{ message: string }>
> {
  const { session, denied } = await requireUserAction();
  if (denied) return denied;

  try {
    const user = await findUserById(session.user.id);
    if (!user) return notFound(USER_NOT_FOUND_MESSAGE);
    if (user.emailVerified) return invalid(ALREADY_VERIFIED_MESSAGE);

    const recent = await findRecentVerification(user.id);
    if (recent) {
      return failed(
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
    return {
      ok: true,
      data: { message: 'Email weryfikacyjny został wysłany ponownie' },
    };
  } catch (error) {
    logger.error({ error }, 'Error resending verification email');
    return failed(SEND_FAILED_MESSAGE);
  }
}
