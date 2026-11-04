/* eslint-disable local/require-action-auth-guard -- public: used by a signed-out visitor with an emailed token; the Turnstile check guards it */
'use server';

import bcrypt from 'bcrypt';

import { type ActionResult, failed, invalid } from '@/actions/action-result';
import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import { hashToken } from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { resetPasswordTransaction } from '@/lib/mutations/password-reset/reset-password-transaction';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { findPasswordResetByToken } from '@/lib/queries/password-reset/find-password-reset-by-token';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { AuthMethod } from '@/lib/types';

const logger = createLogger('action:reset-password');

const REQUIRED_FIELDS_MESSAGE = 'Token i hasło są wymagane';
const TURNSTILE_FAILED_MESSAGE = 'Nieprawidłowe potwierdzenie turnstile';
const INVALID_TOKEN_MESSAGE = 'Nieprawidłowy lub wygasły token';
const TOKEN_EXPIRED_MESSAGE = 'Token wygasł';
const TOKEN_USED_MESSAGE = 'Token został już użyty';
const GOOGLE_ACCOUNT_MESSAGE =
  'Konto Google nie może resetować hasła. Użyj logowania przez Google.';
const RESET_FAILED_MESSAGE = 'Nie udało się zresetować hasła';

export interface ResetPasswordInput {
  token: string;
  password: string;
  turnstileToken: string | null;
}

/** Sets a new password for the account behind a valid, unused reset token. */
export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult<void>> {
  const token = typeof input.token === 'string' ? input.token : '';
  const password = typeof input.password === 'string' ? input.password : '';

  if (!token || !password) {
    return invalid(REQUIRED_FIELDS_MESSAGE);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return invalid(PASSWORD_TOO_SHORT_MESSAGE);
  }

  if (!(await verifyTurnstileToken(input.turnstileToken ?? undefined))) {
    return invalid(TURNSTILE_FAILED_MESSAGE);
  }

  try {
    const resetToken = await findPasswordResetByToken(hashToken(token));

    if (!resetToken) {
      return invalid(INVALID_TOKEN_MESSAGE);
    }

    if (resetToken.expiresAt < new Date()) {
      return invalid(TOKEN_EXPIRED_MESSAGE);
    }

    if (resetToken.used) {
      return invalid(TOKEN_USED_MESSAGE);
    }

    if (resetToken.user.authMethod === AuthMethod.GOOGLE) {
      logger.warn(
        { email: resetToken.user.email },
        'Password reset attempted for OAuth user'
      );
      return invalid(GOOGLE_ACCOUNT_MESSAGE);
    }

    const consumed = await resetPasswordTransaction(
      resetToken.userId,
      await bcrypt.hash(password, BCRYPT_COST),
      resetToken.id
    );

    if (!consumed) {
      logger.warn(
        { userId: resetToken.userId },
        'Password reset token was consumed by a concurrent request'
      );
      return invalid(TOKEN_USED_MESSAGE);
    }

    logger.info(
      { email: resetToken.user.email, userId: resetToken.userId },
      'Password reset successfully'
    );
    authMetrics.recordPasswordReset('success');

    return { ok: true, data: undefined };
  } catch (error) {
    logger.error({ error }, 'Error resetting password');
    authMetrics.recordPasswordReset('failure');
    return failed(RESET_FAILED_MESSAGE);
  }
}
