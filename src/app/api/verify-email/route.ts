import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
import { isVerificationExpired } from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';

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

    // Find verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { code: token },
      include: { user: true },
    });

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
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { verified: true },
      }),
    ]);

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

    // Find verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { code: token },
      select: {
        id: true,
        verified: true,
        expiresAt: true,
        user: {
          select: {
            email: true,
            emailVerified: true,
          },
        },
      },
    });

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
