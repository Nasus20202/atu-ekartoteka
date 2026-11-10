/* eslint-disable local/require-action-auth-guard -- public: runs before the user has an account; the Turnstile check guards it */
'use server';

import bcrypt from 'bcrypt';

import { type ActionResult, failed, invalid } from '@/actions/action-result';
import {
  notifyAdminsAboutRegistration,
  type RegisteredUser,
  sendRegistrationVerification,
} from '@/actions/auth/registration-notifications';
import { Prisma } from '@/generated/prisma/client';
import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  EMAIL_TAKEN_MESSAGE,
  validateCredentials,
} from '@/lib/auth/credential-validation';
import { normalizeEmail } from '@/lib/auth/email';
import { createRegistrationAutoLoginToken } from '@/lib/auth/registration-auto-login-token';
import { createLogger } from '@/lib/logger';
import { createFirstAdmin } from '@/lib/mutations/users/create-first-admin';
import { createUser } from '@/lib/mutations/users/create-user';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { isTurnstileEnabled, verifyTurnstileToken } from '@/lib/turnstile';
import { AccountStatus, UserRole } from '@/lib/types';

const logger = createLogger('action:register');

const ADMIN_EXISTS_MESSAGE = 'Administrator już istnieje w systemie';
const REGISTRATION_FAILED_MESSAGE = 'Nie udało się utworzyć konta';
const TURNSTILE_FAILED_MESSAGE = 'Nieprawidłowe potwierdzenie turnstile';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  isFirstAdmin: boolean;
  turnstileToken: string | null;
}

export interface RegisterData {
  autoLoginToken: string | null;
  requiresVerification: boolean;
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

async function createAccount(
  email: string,
  hashedPassword: string,
  name: string | null,
  isFirstAdmin: boolean
): Promise<RegisteredUser | null> {
  if (isFirstAdmin) {
    return createFirstAdmin({ email, hashedPassword, name });
  }

  return createUser({
    email,
    hashedPassword,
    name,
    role: UserRole.TENANT,
    status: AccountStatus.PENDING,
    emailVerified: false,
  });
}

/** Creates an account; the first admin or a pending tenant with a verification email. */
export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<RegisterData>> {
  const email = normalizeEmail(
    typeof input.email === 'string' ? input.email : ''
  );
  const password = typeof input.password === 'string' ? input.password : '';
  const name = typeof input.name === 'string' ? input.name : '';
  const isFirstAdmin = input.isFirstAdmin === true;

  logger.info({ isFirstAdmin }, 'Registration attempt');

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return invalid(validationError);
  }

  if (
    isTurnstileEnabled() &&
    !(await verifyTurnstileToken(input.turnstileToken ?? undefined))
  ) {
    logger.warn('Registration failed: invalid Turnstile token');
    return invalid(TURNSTILE_FAILED_MESSAGE);
  }

  try {
    if (await findUserByEmail(email)) {
      logger.warn('Registration failed: user already exists');
      return invalid(EMAIL_TAKEN_MESSAGE);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
    const user = await createAccount(
      email,
      hashedPassword,
      name || null,
      isFirstAdmin
    );

    if (!user) {
      logger.warn(
        'Attempted first admin registration but admin already exists'
      );
      return invalid(ADMIN_EXISTS_MESSAGE);
    }

    if (!isFirstAdmin) {
      await sendRegistrationVerification(user);
      await notifyAdminsAboutRegistration(user);
    }

    logger.info(
      { userId: user.id, isFirstAdmin },
      'User registered successfully'
    );
    authMetrics.recordRegistration('credentials', 'success');

    return {
      ok: true,
      data: {
        autoLoginToken: createRegistrationAutoLoginToken(user.email),
        requiresVerification: !isFirstAdmin,
      },
    };
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      return invalid(EMAIL_TAKEN_MESSAGE);
    }

    logger.error({ error }, 'Registration error');
    authMetrics.recordRegistration('credentials', 'failure');
    return failed(REGISTRATION_FAILED_MESSAGE);
  }
}
