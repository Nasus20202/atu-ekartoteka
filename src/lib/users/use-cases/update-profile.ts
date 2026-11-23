import bcrypt from 'bcrypt';

import { BCRYPT_COST } from '@/lib/auth/rules/bcrypt-cost';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/rules/password-rules';
import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  notFoundResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { toUserDto, type UserDto } from '@/lib/users/dto/user-dto';
import { updateUserProfile } from '@/lib/users/mutations/update-user-profile';
import { findUserById } from '@/lib/users/queries/find-user-by-id';

const logger = createLogger('action:profile');

const CURRENT_PASSWORD_REQUIRED =
  'Obecne hasło jest wymagane aby zmienić hasło';
const CURRENT_PASSWORD_WRONG = 'Obecne hasło jest nieprawidłowe';
const INVALID_PASSWORD_MESSAGE = 'Nieprawidłowe hasło';
const NOT_FOUND_MESSAGE = 'Nie znaleziono użytkownika';
const UPDATE_FAILED_MESSAGE = 'Nie udało się zaktualizować profilu';

/**
 * The values as the browser sent them. They are checked here by type, because
 * the order of the checks decides which message the user sees.
 */
export interface ProfileChanges {
  name?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
}

interface ProfileUser {
  password: string | null;
  mustChangePassword: boolean;
}

function requestedChanges({ name, newPassword }: ProfileChanges): string[] {
  const changes: string[] = [];
  if (name !== undefined) changes.push('name');
  if (newPassword) changes.push('password');
  return changes;
}

/** The new password hash, or null when the password is not being changed. */
async function hashNewPassword(
  user: ProfileUser,
  { currentPassword, newPassword }: ProfileChanges,
  userId: string
): Promise<UseCaseResult<string | null>> {
  if (!newPassword) {
    return { ok: true, data: null };
  }

  if (
    typeof newPassword === 'string' &&
    newPassword.length < MIN_PASSWORD_LENGTH
  ) {
    return invalidResult(PASSWORD_TOO_SHORT_MESSAGE);
  }

  if (typeof newPassword !== 'string') {
    return invalidResult(INVALID_PASSWORD_MESSAGE);
  }

  // Users with mustChangePassword set may skip the current password check.
  // The database value is authoritative: a stale token must not relax the
  // check (e.g. when an admin forced a password change mid-session).
  if (!user.mustChangePassword) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      return invalidResult(CURRENT_PASSWORD_REQUIRED);
    }

    if (
      !user.password ||
      !(await bcrypt.compare(currentPassword, user.password))
    ) {
      logger.warn(
        { userId },
        'Failed password change attempt: incorrect current password'
      );
      return invalidResult(CURRENT_PASSWORD_WRONG);
    }
  }

  return { ok: true, data: await bcrypt.hash(newPassword, BCRYPT_COST) };
}

export async function updateProfile(
  userId: string,
  changes: ProfileChanges
): Promise<UseCaseResult<UserDto>> {
  const changesRequested = requestedChanges(changes);

  logger.info(
    { userId, changes: changesRequested },
    'Profile update requested'
  );

  try {
    const user = await findUserById(userId);

    if (!user) return notFoundResult(NOT_FOUND_MESSAGE);

    const passwordHash = await hashNewPassword(user, changes, userId);
    if (!passwordHash.ok) return passwordHash;

    const { name } = changes;
    const updatedUser = await updateUserProfile({
      id: userId,
      ...(name !== undefined && {
        name: typeof name === 'string' && name ? name : null,
      }),
      ...(passwordHash.data !== null && {
        password: passwordHash.data,
        // Clear the forced change flag whenever a password is successfully changed
        mustChangePassword: false,
      }),
    });

    logger.info(
      { userId, changes: changesRequested },
      'Profile updated successfully'
    );

    return { ok: true, data: toUserDto(updatedUser) };
  } catch (error) {
    logger.error({ error }, UPDATE_FAILED_MESSAGE);
    return failedResult(UPDATE_FAILED_MESSAGE);
  }
}
