import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
import { getEmailService } from '@/lib/email/email-service';
import {
  generateSecureToken,
  getVerificationExpiration,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { notifyAdminsOfNewUser } from '@/lib/notifications/new-user-registration';
import { AccountStatus, UserRole } from '@/lib/types';

const logger = createLogger('api:register');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, isFirstAdmin } = body;

    logger.info({ email, isFirstAdmin }, 'Registration attempt');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i hasło są wymagane' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy format email' },
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn({ email }, 'Registration failed: user already exists');
      return NextResponse.json(
        { error: 'Użytkownik z tym adresem email już istnieje' },
        { status: 400 }
      );
    }

    // Check if this is first admin registration
    let role: UserRole = UserRole.TENANT;
    let status: AccountStatus = AccountStatus.PENDING;

    if (isFirstAdmin) {
      // Verify no admin exists
      const adminExists = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      if (adminExists) {
        logger.warn(
          { email },
          'Attempted first admin registration but admin already exists'
        );
        return NextResponse.json(
          { error: 'Administrator już istnieje w systemie' },
          { status: 400 }
        );
      }

      role = UserRole.ADMIN;
      status = AccountStatus.APPROVED;
      logger.info({ email }, 'Creating first admin user');
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role,
        status,
        emailVerified: isFirstAdmin ? true : false, // First admin is auto-verified
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send verification email for non-admin users
    if (!isFirstAdmin) {
      try {
        const verificationToken = generateSecureToken();
        const expiresAt = getVerificationExpiration(24);

        // Store verification token in database
        await prisma.emailVerification.create({
          data: {
            userId: user.id,
            code: verificationToken,
            expiresAt,
          },
        });

        // Send verification email
        const emailService = getEmailService();
        await emailService.sendVerificationEmail(
          user.email,
          verificationToken,
          user.name || undefined
        );

        logger.info(
          { email: user.email, userId: user.id },
          'Verification email sent'
        );
      } catch (emailError) {
        logger.error(
          { error: emailError, email: user.email },
          'Failed to send verification email'
        );
        // Don't fail registration if email fails
      }
    }

    // Notify admins of new user registration (for non-admin users)
    if (!isFirstAdmin) {
      try {
        await notifyAdminsOfNewUser(
          user.email,
          user.name || 'Brak imienia',
          user.createdAt
        );
      } catch (notificationError) {
        logger.error(
          { error: notificationError, email: user.email },
          'Failed to notify admins of new user'
        );
        // Don't fail registration if notification fails
      }
    }

    logger.info(
      { email: user.email, role: user.role, status: user.status },
      'User registered successfully'
    );

    return NextResponse.json(
      {
        message: isFirstAdmin
          ? 'Konto utworzone pomyślnie'
          : 'Konto utworzone pomyślnie. Sprawdź swoją skrzynkę email, aby potwierdzić adres.',
        user,
        requiresVerification: !isFirstAdmin,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ error }, 'Registration error');
    return NextResponse.json(
      {
        error: 'Nie udało się utworzyć konta',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
