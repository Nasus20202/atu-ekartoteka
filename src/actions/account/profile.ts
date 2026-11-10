'use server';

import bcrypt from 'bcrypt';

import {
  type ActionResult,
  failed,
  invalid,
  notFound,
  readInput,
} from '@/actions/action-result';
import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import { requireUserAction } from '@/lib/auth/require-action';
import { createLogger } from '@/lib/logger';
import { updateUserProfile } from '@/lib/mutations/users/update-user-profile';
import { findUserById } from '@/lib/queries/users/find-user-by-id';
import { toUserDto, type UserDto } from '@/lib/types/dto/user-dto';

const logger = createLogger('action:profile');

const CURRENT_PASSWORD_REQUIRED =
  'Obecne hasło jest wymagane aby zmienić hasło';
const CURRENT_PASSWORD_WRONG = 'Obecne hasło jest nieprawidłowe';

export async function updateProfileAction(
  input: unknown
): Promise<ActionResult<UserDto>> {
  const { session, denied } = await requireUserAction();
  if (denied) return denied;

  const { name, currentPassword, newPassword } = readInput(input);

  const changesRequested = [];
  if (name !== undefined) changesRequested.push('name');
  if (newPassword) changesRequested.push('password');

  logger.info(
    { userId: session.user.id, changes: changesRequested },
    'Profile update requested'
  );

  try {
    const user = await findUserById(session.user.id);

    if (!user) return notFound('Nie znaleziono użytkownika');

    const updateData: {
      name?: string | null;
      password?: string;
      mustChangePassword?: boolean;
    } = {};

    if (name !== undefined) {
      updateData.name = typeof name === 'string' && name ? name : null;
    }

    if (
      newPassword &&
      typeof newPassword === 'string' &&
      newPassword.length < MIN_PASSWORD_LENGTH
    ) {
      return invalid(PASSWORD_TOO_SHORT_MESSAGE);
    }

    if (newPassword) {
      if (typeof newPassword !== 'string') {
        return invalid('Nieprawidłowe hasło');
      }

      // Users with mustChangePassword set may skip the current password check.
      // The database value is authoritative: a stale token must not relax the
      // check (e.g. when an admin forced a password change mid-session).
      if (!user.mustChangePassword) {
        if (!currentPassword || typeof currentPassword !== 'string') {
          return invalid(CURRENT_PASSWORD_REQUIRED);
        }

        if (
          !user.password ||
          !(await bcrypt.compare(currentPassword, user.password))
        ) {
          logger.warn(
            { userId: session.user.id },
            'Failed password change attempt: incorrect current password'
          );
          return invalid(CURRENT_PASSWORD_WRONG);
        }
      }

      updateData.password = await bcrypt.hash(newPassword, BCRYPT_COST);
      // Clear the forced change flag whenever a password is successfully changed
      updateData.mustChangePassword = false;
    }

    const updatedUser = await updateUserProfile({
      id: session.user.id,
      ...updateData,
    });

    logger.info(
      { userId: session.user.id, changes: changesRequested },
      'Profile updated successfully'
    );

    return { ok: true, data: toUserDto(updatedUser) };
  } catch (error) {
    logger.error({ error }, 'Nie udało się zaktualizować profilu');
    return failed('Nie udało się zaktualizować profilu');
  }
}
