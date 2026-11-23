import bcrypt from 'bcrypt';

import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  EMAIL_TAKEN_MESSAGE,
  validateCredentials,
} from '@/lib/auth/credential-validation';
import { normalizeEmail } from '@/lib/auth/email';
import { createRegistrationAutoLoginToken } from '@/lib/auth/registration-auto-login-token';
import { isTurnstileEnabled, verifyTurnstileToken } from '@/lib/auth/turnstile';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import {
  notifyAdminsAboutRegistration,
  type RegisteredUser,
  sendRegistrationVerification,
} from '@/lib/auth/use-cases/registration-notifications';
import { createLogger } from '@/lib/platform/logging/logger';
import { authMetrics } from '@/lib/platform/opentelemetry/auth-metrics';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { createFirstAdmin } from '@/lib/users/mutations/create-first-admin';
import { createUser } from '@/lib/users/mutations/create-user';
import { findUserByEmail } from '@/lib/users/queries/find-user-by-email';

const logger = createLogger('action:register');

const ADMIN_EXISTS_MESSAGE = 'Administrator już istnieje w systemie';
const REGISTRATION_FAILED_MESSAGE = 'Nie udało się utworzyć konta';
const TURNSTILE_FAILED_MESSAGE = 'Nieprawidłowe potwierdzenie turnstile';

export interface RegisterAccountInput {
  email: string;
  password: string;
  name: string;
  isFirstAdmin: boolean;
  turnstileToken: string | null;
}

export interface RegisterData {
  autoLoginToken: string | null;
  requiresVerification: boolean;
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

/** Creates an account: the first admin, or a pending tenant who gets a verification email. */
export async function registerAccount(
  input: RegisterAccountInput
): Promise<UseCaseResult<RegisterData>> {
  const email = normalizeEmail(input.email);
  const { password, name, isFirstAdmin } = input;

  logger.info({ isFirstAdmin }, 'Registration attempt');

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return invalidResult(validationError);
  }

  if (
    isTurnstileEnabled() &&
    !(await verifyTurnstileToken(input.turnstileToken ?? undefined))
  ) {
    logger.warn('Registration failed: invalid Turnstile token');
    return invalidResult(TURNSTILE_FAILED_MESSAGE);
  }

  try {
    if (await findUserByEmail(email)) {
      logger.warn('Registration failed: user already exists');
      return invalidResult(EMAIL_TAKEN_MESSAGE);
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
        isFirstAdmin
          ? 'Attempted first admin registration but admin already exists'
          : 'Registration failed: email taken during insert'
      );
      return invalidResult(
        isFirstAdmin ? ADMIN_EXISTS_MESSAGE : EMAIL_TAKEN_MESSAGE
      );
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
    logger.error({ error }, 'Registration error');
    authMetrics.recordRegistration('credentials', 'failure');
    return failedResult(REGISTRATION_FAILED_MESSAGE);
  }
}
