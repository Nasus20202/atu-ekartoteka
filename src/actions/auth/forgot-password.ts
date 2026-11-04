/* eslint-disable local/require-action-auth-guard -- public: requested by a signed-out visitor; the Turnstile check guards it */
'use server';

import { type ActionResult, failed, invalid } from '@/actions/action-result';
import { normalizeEmail } from '@/lib/auth/email';
import { getEmailService } from '@/lib/email/email-service';
import { generateSecureToken, hashToken } from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { createPasswordReset } from '@/lib/mutations/password-reset/create-password-reset';
import { deletePasswordResetsForUser } from '@/lib/mutations/password-reset/delete-password-resets-for-user';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { AuthMethod } from '@/lib/types';

const logger = createLogger('action:forgot-password');

const TURNSTILE_FAILED_MESSAGE = 'Nieprawidłowe potwierdzenie turnstile';
const EMAIL_REQUIRED_MESSAGE = 'Email jest wymagany';
const REQUEST_FAILED_MESSAGE = 'Nie udało się przetworzyć żądania';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface ForgotPasswordInput {
  email: string;
  turnstileToken: string | null;
}

/**
 * Emails a reset link when the account exists. Returns success either way, so
 * the response never reveals whether an email is registered.
 */
export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult<void>> {
  if (!(await verifyTurnstileToken(input.turnstileToken ?? undefined))) {
    logger.warn({}, 'Forgot password failed: invalid Turnstile token');
    return invalid(TURNSTILE_FAILED_MESSAGE);
  }

  const email = typeof input.email === 'string' ? input.email : '';
  if (!email) {
    return invalid(EMAIL_REQUIRED_MESSAGE);
  }

  try {
    const user = await findUserByEmail(normalizeEmail(email));

    if (!user) {
      logger.warn({ email }, 'Password reset requested for non-existent user');
      return { ok: true, data: undefined };
    }

    if (user.authMethod === AuthMethod.GOOGLE) {
      logger.warn({ email }, 'Password reset requested for OAuth user');
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

    logger.info(
      { email: user.email, userId: user.id },
      'Password reset email sent'
    );

    return { ok: true, data: undefined };
  } catch (error) {
    logger.error({ error }, 'Error processing password reset request');
    return failed(REQUEST_FAILED_MESSAGE);
  }
}
