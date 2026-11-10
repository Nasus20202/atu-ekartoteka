/* eslint-disable local/require-action-auth-guard -- public: the link in the verification email is opened by a signed-out visitor */
'use server';

import { type ActionResult, failed, invalid } from '@/actions/action-result';
import {
  hashToken,
  isVerificationExpired,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { verifyEmailTransaction } from '@/lib/mutations/email-verification/verify-email-transaction';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { findVerificationByCode } from '@/lib/queries/email-verification/find-verification-by-code';

const logger = createLogger('action:verify-email');

const TOKEN_REQUIRED_MESSAGE = 'Token weryfikacyjny jest wymagany';
const INVALID_TOKEN_MESSAGE = 'Nieprawidłowy token weryfikacyjny';
const TOKEN_USED_MESSAGE = 'Ten token został już użyty';
const TOKEN_EXPIRED_MESSAGE = 'Token weryfikacyjny wygasł. Poproś o nowy link.';
const VERIFY_FAILED_MESSAGE = 'Nie udało się zweryfikować emaila';

/** Marks the user's email as verified when the token is valid and unused. */
export async function verifyEmailAction(
  token: string
): Promise<ActionResult<void>> {
  if (typeof token !== 'string' || !token) {
    return invalid(TOKEN_REQUIRED_MESSAGE);
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
      return invalid(INVALID_TOKEN_MESSAGE);
    }

    if (verification.verified) {
      logger.info({ userId: verification.userId }, 'Token already used');
      return invalid(TOKEN_USED_MESSAGE);
    }

    if (isVerificationExpired(verification.expiresAt)) {
      logger.warn(
        { userId: verification.userId, expiresAt: verification.expiresAt },
        'Verification token expired'
      );
      return invalid(TOKEN_EXPIRED_MESSAGE);
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
      return invalid(TOKEN_USED_MESSAGE);
    }

    logger.info({ userId: verification.userId }, 'Email verified successfully');
    authMetrics.recordEmailVerification('success');

    return { ok: true, data: undefined };
  } catch (error) {
    logger.error({ error }, 'Email verification error');
    authMetrics.recordEmailVerification('failure');
    return failed(VERIFY_FAILED_MESSAGE);
  }
}
