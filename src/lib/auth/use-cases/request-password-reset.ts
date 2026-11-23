import { verifyTurnstileToken } from '@/lib/auth/gateways/turnstile';
import { createPasswordReset } from '@/lib/auth/mutations/create-password-reset';
import { deletePasswordResetsForUser } from '@/lib/auth/mutations/delete-password-resets-for-user';
import { normalizeEmail } from '@/lib/auth/rules/email';
import {
  generateSecureToken,
  hashToken,
} from '@/lib/auth/rules/verification-tokens';
import { AuthMethod } from '@/lib/auth/types/account';
import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { findUserByEmail } from '@/lib/users/queries/find-user-by-email';

const logger = createLogger('action:forgot-password');

const TURNSTILE_FAILED_MESSAGE = 'Nieprawidłowe potwierdzenie turnstile';
const EMAIL_REQUIRED_MESSAGE = 'Email jest wymagany';
const REQUEST_FAILED_MESSAGE = 'Nie udało się przetworzyć żądania';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface PasswordResetRequest {
  email: string;
  turnstileToken: string | null;
}

/**
 * Emails a reset link when the account exists. Returns success either way, so
 * the response never reveals whether an email is registered.
 */
export async function requestPasswordReset({
  email,
  turnstileToken,
}: PasswordResetRequest): Promise<UseCaseResult<void>> {
  if (!(await verifyTurnstileToken(turnstileToken ?? undefined))) {
    logger.warn('Forgot password failed: invalid Turnstile token');
    return invalidResult(TURNSTILE_FAILED_MESSAGE);
  }

  if (!email) {
    return invalidResult(EMAIL_REQUIRED_MESSAGE);
  }

  try {
    const user = await findUserByEmail(normalizeEmail(email));

    if (!user) {
      logger.warn('Password reset requested for non-existent user');
      return { ok: true, data: undefined };
    }

    if (user.authMethod === AuthMethod.GOOGLE) {
      logger.warn(
        { userId: user.id },
        'Password reset requested for OAuth user'
      );
      return { ok: true, data: undefined };
    }

    await deletePasswordResetsForUser(user.id);

    const token = generateSecureToken();
    await createPasswordReset({
      userId: user.id,
      hashedToken: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    await getEmailService().sendPasswordResetEmail(
      user.email,
      token,
      user.name || undefined
    );

    logger.info({ userId: user.id }, 'Password reset email sent');

    return { ok: true, data: undefined };
  } catch (error) {
    logger.error({ error }, 'Error processing password reset request');
    return failedResult(REQUEST_FAILED_MESSAGE);
  }
}
