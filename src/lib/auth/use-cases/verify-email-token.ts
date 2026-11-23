import { verifyEmailTransaction } from '@/lib/auth/mutations/verify-email-transaction';
import { findVerificationByCode } from '@/lib/auth/queries/find-verification-by-code';
import {
  hashToken,
  isVerificationExpired,
} from '@/lib/auth/verification-tokens';
import { createLogger } from '@/lib/platform/logging/logger';
import { authMetrics } from '@/lib/platform/opentelemetry/auth-metrics';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';

const logger = createLogger('action:verify-email');

const TOKEN_REQUIRED_MESSAGE = 'Token weryfikacyjny jest wymagany';
const INVALID_TOKEN_MESSAGE = 'Nieprawidłowy token weryfikacyjny';
const TOKEN_USED_MESSAGE = 'Ten token został już użyty';
const TOKEN_EXPIRED_MESSAGE = 'Token weryfikacyjny wygasł. Poproś o nowy link.';
const VERIFY_FAILED_MESSAGE = 'Nie udało się zweryfikować emaila';

/** Marks the user's email as verified when the token is valid and unused. */
export async function verifyEmailToken(
  token: string
): Promise<UseCaseResult<void>> {
  if (!token) {
    return invalidResult(TOKEN_REQUIRED_MESSAGE);
  }

  try {
    const verification = await findVerificationByCode(hashToken(token));

    if (!verification) {
      logger.warn(
        {
          tokenLength: token.length,
          tokenFingerprint: hashToken(token).slice(0, 12),
        },
        'Invalid verification token'
      );
      return invalidResult(INVALID_TOKEN_MESSAGE);
    }

    if (verification.verified) {
      logger.info({ userId: verification.userId }, 'Token already used');
      return invalidResult(TOKEN_USED_MESSAGE);
    }

    if (isVerificationExpired(verification.expiresAt)) {
      logger.warn(
        { userId: verification.userId, expiresAt: verification.expiresAt },
        'Verification token expired'
      );
      return invalidResult(TOKEN_EXPIRED_MESSAGE);
    }

    const consumed = await verifyEmailTransaction(
      verification.userId,
      verification.id
    );

    if (!consumed) {
      logger.info(
        { userId: verification.userId },
        'Verification token consumed by a concurrent request'
      );
      return invalidResult(TOKEN_USED_MESSAGE);
    }

    logger.info({ userId: verification.userId }, 'Email verified successfully');
    authMetrics.recordEmailVerification('success');

    return { ok: true, data: undefined };
  } catch (error) {
    logger.error({ error }, 'Email verification error');
    authMetrics.recordEmailVerification('failure');
    return failedResult(VERIFY_FAILED_MESSAGE);
  }
}
