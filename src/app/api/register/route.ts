import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@/generated/prisma/client';
import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  EMAIL_TAKEN_MESSAGE,
  validateCredentials,
} from '@/lib/auth/credential-validation';
import { normalizeEmail } from '@/lib/auth/email';
import { createRegistrationAutoLoginToken } from '@/lib/auth/registration-auto-login-token';
import { getEmailService } from '@/lib/email/email-service';
import {
  generateSecureToken,
  getVerificationExpiration,
  hashToken,
} from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { createEmailVerification } from '@/lib/mutations/email-verification/create-verification';
import { createFirstAdmin } from '@/lib/mutations/users/create-first-admin';
import { createUser } from '@/lib/mutations/users/create-user';
import { notifyAdminsOfNewUser } from '@/lib/notifications/new-user-registration';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { isTurnstileEnabled, verifyTurnstileToken } from '@/lib/turnstile';
import { AccountStatus, UserRole } from '@/lib/types';

const logger = createLogger('api:register');

const ADMIN_EXISTS_MESSAGE = 'Administrator już istnieje w systemie';
const REGISTRATION_FAILED_MESSAGE = 'Nie udało się utworzyć konta';

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, name, isFirstAdmin, turnstileToken } = body;
    const email = normalizeEmail(String(body.email ?? ''));

    logger.info({ email, isFirstAdmin }, 'Registration attempt');

    const validationError = validateCredentials(email, password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Verify Turnstile token only if enabled
    if (isTurnstileEnabled()) {
      const isTurnstileValid = await verifyTurnstileToken(turnstileToken);
      if (!isTurnstileValid) {
        logger.warn({ email }, 'Registration failed: invalid Turnstile token');
        return NextResponse.json(
          { error: 'Nieprawidłowe potwierdzenie turnstile' },
          { status: 400 }
        );
      }
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      logger.warn({ email }, 'Registration failed: user already exists');
      return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    let user;
    if (isFirstAdmin) {
      user = await createFirstAdmin({
        email,
        hashedPassword,
        name: name || null,
      });

      if (!user) {
        logger.warn(
          { email },
          'Attempted first admin registration but admin already exists'
        );
        return NextResponse.json(
          { error: ADMIN_EXISTS_MESSAGE },
          { status: 400 }
        );
      }

      logger.info({ email }, 'Creating first admin user');
    } else {
      user = await createUser({
        email,
        hashedPassword,
        name: name || null,
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: false,
      });
    }

    // Send verification email for non-admin users
    if (!isFirstAdmin) {
      try {
        const verificationToken = generateSecureToken();
        const expiresAt = getVerificationExpiration(24);

        // Store hashed verification token in database (plain token is sent via email)
        const hashedToken = hashToken(verificationToken);
        await createEmailVerification({
          userId: user.id,
          hashedCode: hashedToken,
          expiresAt,
        });

        // Send verification email with plain token
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

    authMetrics.recordRegistration('credentials', 'success');
    const autoLoginToken = createRegistrationAutoLoginToken(user.email);

    return NextResponse.json(
      {
        message: isFirstAdmin
          ? 'Konto utworzone pomyślnie'
          : 'Konto utworzone pomyślnie. Sprawdź swoją skrzynkę email, aby potwierdzić adres.',
        user,
        requiresVerification: !isFirstAdmin,
        autoLoginToken,
      },
      { status: 201 }
    );
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 400 });
    }

    logger.error({ error }, 'Registration error');
    authMetrics.recordRegistration('credentials', 'failure');
    return NextResponse.json(
      { error: REGISTRATION_FAILED_MESSAGE },
      { status: 500 }
    );
  }
}
