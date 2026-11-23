import bcrypt from 'bcrypt';

import { BCRYPT_COST } from '@/lib/auth/rules/bcrypt-cost';
import {
  EMAIL_TAKEN_MESSAGE,
  validateCredentials,
} from '@/lib/auth/rules/credential-validation';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { createAdminUser } from '@/lib/users/mutations/create-admin-user';
import { findUserByEmail } from '@/lib/users/queries/find-user-by-email';

const logger = createLogger('action:users');

export type CreatedUser = Awaited<ReturnType<typeof createAdminUser>>;

/**
 * The values as the browser sent them. Email and password are already strings
 * or undefined; role, status and name are checked here by type.
 */
export interface AdminUserCreation {
  adminId: string;
  email: string | undefined;
  password: string | undefined;
  name: unknown;
  role: unknown;
  status: unknown;
}

export async function createUserByAdmin({
  adminId,
  email,
  password,
  name,
  role,
  status,
}: AdminUserCreation): Promise<UseCaseResult<CreatedUser>> {
  logger.info({ adminId, role }, 'Admin creating new user');

  const validationError = validateCredentials(email, password);
  if (validationError) return invalidResult(validationError);

  if (role && !Object.values(UserRole).includes(role as UserRole)) {
    return invalidResult('Nieprawidłowa rola');
  }

  if (
    status &&
    !Object.values(AccountStatus).includes(status as AccountStatus)
  ) {
    return invalidResult('Nieprawidłowy status konta');
  }

  try {
    if (await findUserByEmail(email as string)) {
      logger.warn({ adminId }, 'User creation failed: e-mail already in use');
      return invalidResult(EMAIL_TAKEN_MESSAGE);
    }

    const hashedPassword = await bcrypt.hash(password as string, BCRYPT_COST);

    const user = await createAdminUser({
      email: email as string,
      hashedPassword,
      name: (name as string) || null,
      role: (role as UserRole) || UserRole.TENANT,
      status: (status as AccountStatus) || AccountStatus.PENDING,
    });

    logger.info({ adminId, userId: user.id }, 'Admin created user');
    return { ok: true, data: user };
  } catch (error) {
    logger.error({ error }, 'Failed to create user');
    return failedResult('Nie udało się utworzyć użytkownika');
  }
}
