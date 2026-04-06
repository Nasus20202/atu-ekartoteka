import { NextRequest, NextResponse } from 'next/server';

import {
  hashToken,
  isVerificationExpired,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { verifyEmailTransaction } from '@/lib/mutations/email-verification/verify-email-transaction';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import {
  findVerificationByCode,
  findVerificationByCodeMinimal,
} from '@/lib/queries/email-verification/find-verification-by-code';

const logger = createLogger('api:verify-email');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token weryfikacyjny jest wymagany' },
        { status: 400 }
      );
    }

    // Hash the incoming token and find matching verification record
    const hashedToken = hashToken(token);
    const verification = await findVerificationByCode(hashedToken);

    if (!verification) {
      logger.warn({ token }, 'Invalid verification token');
      return NextResponse.json(
        { error: 'Nieprawidłowy token weryfikacyjny' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (verification.verified) {
      logger.info({ userId: verification.userId }, 'Token already used');
      return NextResponse.json(
        { error: 'Ten token został już użyty' },
        { status: 400 }
      );
    }

    // Check if expired
    if (isVerificationExpired(verification.expiresAt)) {
      logger.warn(
        { userId: verification.userId, expiresAt: verification.expiresAt },
        'Verification token expired'
      );
      return NextResponse.json(
        { error: 'Token weryfikacyjny wygasł. Poproś o nowy link.' },
        { status: 400 }
      );
    }

    // Update user and verification record
    await verifyEmailTransaction(verification.userId, verification.id);

    logger.info(
      { userId: verification.userId, email: verification.user.email },
      'Email verified successfully'
    );

    authMetrics.recordEmailVerification('success');

    return NextResponse.json({
      message: 'Email zweryfikowany pomyślnie',
      success: true,
    });
  } catch (error) {
    logger.error({ error }, 'Email verification error');
    authMetrics.recordEmailVerification('failure');
    return NextResponse.json(
      { error: 'Nie udało się zweryfikować emaila' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token weryfikacyjny jest wymagany' },
        { status: 400 }
      );
    }

    // Hash the incoming token and find matching verification record
    const hashedToken = hashToken(token);
    const verification = await findVerificationByCodeMinimal(hashedToken);

    if (!verification) {
      return NextResponse.json(
        { valid: false, error: 'Nieprawidłowy token weryfikacyjny' },
        { status: 400 }
      );
    }

    const expired = isVerificationExpired(verification.expiresAt);

    return NextResponse.json({
      valid: !expired && !verification.verified,
      expired,
      alreadyVerified: verification.verified || verification.user.emailVerified,
    });
  } catch (error) {
    logger.error({ error }, 'Error checking verification token');
    return NextResponse.json(
      { error: 'Nie udało się sprawdzić tokenu' },
      { status: 500 }
    );
  }
}
