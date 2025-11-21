import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { getEmailService } from '@/lib/email/email-service';
import {
  generateSecureToken,
  getVerificationExpiration,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api:resend-verification');

/**
 * Resend email verification code
 * Requires authenticated session
 */
export async function POST() {
  try {
    // Get session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Użytkownik nie znaleziony' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email jest już zweryfikowany' },
        { status: 400 }
      );
    }

    // Check for recent verification code (rate limiting)
    const recentVerification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentVerification) {
      const timeLeft = Math.ceil(
        (recentVerification.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) /
          1000
      );
      const minutesLeft = Math.ceil(timeLeft / 60);

      return NextResponse.json(
        { error: `Poczekaj ${minutesLeft} min przed ponownym wysłaniem` },
        { status: 429 }
      );
    }

    // Delete old verification codes
    await prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    // Generate new verification token
    const token = generateSecureToken();
    const expiresAt = getVerificationExpiration();

    // Store verification token
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        code: token,
        expiresAt,
      },
    });

    // Send verification email
    const emailService = getEmailService();
    await emailService.sendVerificationEmail(
      user.email,
      token,
      user.name || undefined
    );

    logger.info({ email: user.email }, 'Verification email resent');

    return NextResponse.json({
      message: 'Email weryfikacyjny został wysłany ponownie',
    });
  } catch (error) {
    logger.error({ error }, 'Error resending verification email');
    return NextResponse.json(
      { error: 'Nie udało się wysłać emaila' },
      { status: 500 }
    );
  }
}
