import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getEmailService } from '@/lib/email/email-service';
import {
  generateSecureToken,
  getVerificationExpiration,
  hashToken,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { createEmailVerification } from '@/lib/mutations/email-verification/create-verification';
import { deleteVerificationsForUser } from '@/lib/mutations/email-verification/delete-verifications-for-user';
import { findRecentVerification } from '@/lib/queries/email-verification/find-recent-verification';
import { findUserById } from '@/lib/queries/users/find-user-by-id';

const logger = createLogger('api:resend-verification');

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

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
    const user = await findUserById(session.user.id);

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
    const recentVerification = await findRecentVerification(user.id);

    if (recentVerification) {
      const timeLeft = Math.ceil(
        (recentVerification.createdAt.getTime() +
          RATE_LIMIT_WINDOW_MS -
          Date.now()) /
          1000
      );
      const minutesLeft = Math.ceil(timeLeft / 60);

      return NextResponse.json(
        { error: `Poczekaj ${minutesLeft} min przed ponownym wysłaniem` },
        { status: 429 }
      );
    }

    // Delete old verification codes
    await deleteVerificationsForUser(user.id);

    // Generate new verification token
    const token = generateSecureToken();
    const expiresAt = getVerificationExpiration();

    // Store hashed verification token (plain token is sent via email)
    const hashedToken = hashToken(token);
    await createEmailVerification({
      userId: user.id,
      hashedCode: hashedToken,
      expiresAt,
    });

    // Send verification email with plain token
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
