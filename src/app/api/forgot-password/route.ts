import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
import { getEmailService } from '@/lib/email/email-service';
import { generateSecureToken } from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { verifyTurnstileToken } from '@/lib/turnstile';

const logger = createLogger('api:forgot-password');

/**
 * Request password reset
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, turnstileToken } = body;

    // Validate Turnstile
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) {
      logger.warn({ email }, 'Forgot password failed: invalid Turnstile token');
      return NextResponse.json(
        { error: 'Nieprawidłowe potwierdzenie turnstile' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email jest wymagany' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists or not (security)
    if (!user) {
      logger.warn({ email }, 'Password reset requested for non-existent user');
      return NextResponse.json({
        message: 'Jeśli konto istnieje, email z instrukcjami został wysłany',
      });
    }

    // Delete old password reset tokens
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Generate reset token (valid for 1 hour)
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email
    const emailService = getEmailService();
    await emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.name || undefined
    );

    logger.info(
      { email: user.email, userId: user.id },
      'Password reset email sent'
    );

    return NextResponse.json({
      message: 'Jeśli konto istnieje, email z instrukcjami został wysłany',
    });
  } catch (error) {
    logger.error({ error }, 'Error processing password reset request');
    return NextResponse.json(
      { error: 'Nie udało się przetworzyć żądania' },
      { status: 500 }
    );
  }
}
