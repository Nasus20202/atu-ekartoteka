import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api:reset-password');

/**
 * Reset password with token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token i hasło są wymagane' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 8 znaków' },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Nieprawidłowy lub wygasły token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token wygasł' }, { status: 400 });
    }

    // Check if token was already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Token został już użyty' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    logger.info(
      { email: resetToken.user.email, userId: resetToken.userId },
      'Password reset successfully'
    );

    return NextResponse.json({
      message: 'Hasło zostało zmienione pomyślnie',
    });
  } catch (error) {
    logger.error({ error }, 'Error resetting password');
    return NextResponse.json(
      { error: 'Nie udało się zresetować hasła' },
      { status: 500 }
    );
  }
}
