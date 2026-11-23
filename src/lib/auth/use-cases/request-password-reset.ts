import { verifyTurnstileToken } from '@/lib/auth/gateways/turnstile';
import { replacePasswordReset } from '@/lib/auth/mutations/replace-password-reset';
import { normalizeEmail } from '@/lib/auth/rules/email';
import {
  generateSecureToken,
  hashToken,
} from '@/lib/auth/rules/verification-tokens';
import { AuthMethod } from '@/lib/auth/types/account';
import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import type { AfterResponse } from '@/lib/shared/after-response';
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
export async function requestPasswordReset(
  { email, turnstileToken }: PasswordResetRequest,
  afterResponse: AfterResponse
): Promise<UseCaseResult<void>> {
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

    const token = generateSecureToken();
    await replacePasswordReset({
      userId: user.id,
      hashedToken: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    // Sent after the response: an SMTP round trip only for registered accounts
    // would let the response time reveal which addresses exist
    afterResponse(async () => {
      try {
        const result = await getEmailService().sendPasswordResetEmail(
          user.email,
          token,
          user.name || undefined
        );
        if (result.ok) {
          logger.info({ userId: user.id }, 'Password reset email sent');
        } else {
          logger.error(
            { userId: user.id, reason: result.reason },
            'Password reset email failed'
          );
        }
      } catch (error) {
        logger.error({ error, userId: user.id }, 'Password reset email failed');
      }
    });

    return { ok: true, data: undefined };
  } catch (error) {
    logger.error({ error }, 'Error processing password reset request');
    return failedResult(REQUEST_FAILED_MESSAGE);
  }
}
