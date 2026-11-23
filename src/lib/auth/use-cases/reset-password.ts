import bcrypt from 'bcrypt';

import { verifyTurnstileToken } from '@/lib/auth/gateways/turnstile';
import { resetPasswordTransaction } from '@/lib/auth/mutations/reset-password-transaction';
import { findPasswordResetByToken } from '@/lib/auth/queries/find-password-reset-by-token';
import { BCRYPT_COST } from '@/lib/auth/rules/bcrypt-cost';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/rules/password-rules';
import { hashToken } from '@/lib/auth/rules/verification-tokens';
import { AuthMethod } from '@/lib/auth/types/account';
import { createLogger } from '@/lib/platform/logging/logger';
import { authMetrics } from '@/lib/platform/opentelemetry/auth-metrics';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';

const logger = createLogger('action:reset-password');

const REQUIRED_FIELDS_MESSAGE = 'Token i hasło są wymagane';
const TURNSTILE_FAILED_MESSAGE = 'Nieprawidłowe potwierdzenie turnstile';
const INVALID_TOKEN_MESSAGE = 'Nieprawidłowy lub wygasły token';
const TOKEN_EXPIRED_MESSAGE = 'Token wygasł';
const TOKEN_USED_MESSAGE = 'Token został już użyty';
const GOOGLE_ACCOUNT_MESSAGE =
  'Konto Google nie może resetować hasła. Użyj logowania przez Google.';
const RESET_FAILED_MESSAGE = 'Nie udało się zresetować hasła';

export interface ResetPasswordRequest {
  token: string;
  password: string;
  turnstileToken: string | null;
}

/** Sets a new password for the account behind a valid, unused reset token. */
export async function resetPasswordWithToken(
  request: ResetPasswordRequest
): Promise<UseCaseResult<void>> {
  const { token, password } = request;

  if (!token || !password) {
    return invalidResult(REQUIRED_FIELDS_MESSAGE);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return invalidResult(PASSWORD_TOO_SHORT_MESSAGE);
  }

  if (!(await verifyTurnstileToken(request.turnstileToken ?? undefined))) {
    return invalidResult(TURNSTILE_FAILED_MESSAGE);
  }

  try {
    const resetToken = await findPasswordResetByToken(hashToken(token));

    if (!resetToken) {
      return invalidResult(INVALID_TOKEN_MESSAGE);
    }

    if (resetToken.expiresAt < new Date()) {
      return invalidResult(TOKEN_EXPIRED_MESSAGE);
    }

    if (resetToken.used) {
      return invalidResult(TOKEN_USED_MESSAGE);
    }

    if (resetToken.user.authMethod === AuthMethod.GOOGLE) {
      logger.warn(
        { userId: resetToken.userId },
        'Password reset attempted for OAuth user'
      );
      return invalidResult(GOOGLE_ACCOUNT_MESSAGE);
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
      return invalidResult(TOKEN_USED_MESSAGE);
    }

    logger.info({ userId: resetToken.userId }, 'Password reset successfully');
    authMetrics.recordPasswordReset('success');

    return { ok: true, data: undefined };
  } catch (error) {
    logger.error({ error }, 'Error resetting password');
    authMetrics.recordPasswordReset('failure');
    return failedResult(RESET_FAILED_MESSAGE);
  }
}
