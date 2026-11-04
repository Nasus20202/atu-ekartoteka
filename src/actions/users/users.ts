'use server';

import bcrypt from 'bcrypt';

import {
  type ActionResult,
  failed,
  invalid,
  notFound,
  readInput,
} from '@/actions/action-result';
import { isApprovedStatus } from '@/lib/auth/account-access';
import { isAdminRole } from '@/lib/auth/admin-access';
import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  EMAIL_TAKEN_MESSAGE,
  validateCredentials,
} from '@/lib/auth/credential-validation';
import { requireAdminAction } from '@/lib/auth/require-action';
import { createLogger } from '@/lib/logger';
import { createAdminUser } from '@/lib/mutations/users/create-admin-user';
import { updateUserStatus } from '@/lib/mutations/users/update-user-status';
import { notifyAccountApproved } from '@/lib/notifications/account-status';
import { countApartmentAvailability } from '@/lib/queries/apartments/count-apartment-availability';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { findUserById } from '@/lib/queries/users/find-user-by-id';
import { AccountStatus, UserRole } from '@/lib/types';
import { toUserDto, type UserDto } from '@/lib/types/dto/user-dto';

const logger = createLogger('action:users');

const asString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export async function updateUserStatusAction(
  input: unknown
): Promise<ActionResult<{ user: UserDto }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized user update attempt'
  );
  if (denied) return denied;

  const { userId, status, apartmentIds } = readInput(input);

  logger.info(
    { adminEmail: session.user.email, userId, status },
    'Admin attempting to update user status'
  );

  if (!userId || !status || typeof userId !== 'string') {
    return invalid('Brak wymaganych pól');
  }

  if (
    apartmentIds !== undefined &&
    (!Array.isArray(apartmentIds) ||
      apartmentIds.some((apartmentId) => typeof apartmentId !== 'string'))
  ) {
    return invalid('Nieprawidłowa lista mieszkań');
  }

  if (!Object.values(AccountStatus).includes(status as AccountStatus)) {
    return invalid('Nieprawidłowy status');
  }
  const nextStatus = status as AccountStatus;
  const nextApartmentIds = apartmentIds as string[] | undefined;

  try {
    const user = await findUserById(userId);

    if (!user) return notFound('Użytkownik nie znaleziony');

    if (
      isApprovedStatus(nextStatus) &&
      nextApartmentIds &&
      nextApartmentIds.length > 0
    ) {
      const { found, occupiedByOthers } = await countApartmentAvailability(
        nextApartmentIds,
        userId
      );

      if (found !== nextApartmentIds.length) {
        return notFound('Niektóre mieszkania nie zostały znalezione');
      }

      if (occupiedByOthers > 0) {
        return invalid(
          'Niektóre mieszkania są już przypisane do innego użytkownika'
        );
      }
    }

    const updatedUser = await updateUserStatus({
      userId,
      status: nextStatus,
      apartmentIds: nextApartmentIds,
    });

    logger.info(
      {
        adminEmail: session.user.email,
        userEmail: updatedUser.email,
        status: nextStatus,
        apartmentCount: updatedUser.apartments.length,
      },
      'User status updated'
    );

    // Notify only when the account was just approved
    if (
      isApprovedStatus(nextStatus) &&
      !isApprovedStatus(user.status) &&
      !isAdminRole(updatedUser.role)
    ) {
      await notifyAccountApproved(updatedUser.email, updatedUser.name);
    }

    return { ok: true, data: { user: toUserDto(updatedUser) } };
  } catch (error) {
    logger.error({ error }, 'User update error');
    return failed('Nie udało się zaktualizować użytkownika');
  }
}

export async function createUserAction(
  input: unknown
): Promise<ActionResult<Awaited<ReturnType<typeof createAdminUser>>>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized user creation attempt'
  );
  if (denied) return denied;

  const fields = readInput(input);
  const { name, role, status } = fields;
  const email = asString(fields.email);
  const password = asString(fields.password);

  logger.info(
    { adminEmail: session.user.email, newUserEmail: email, role },
    'Admin creating new user'
  );

  const validationError = validateCredentials(email, password);
  if (validationError) return invalid(validationError);

  if (role && !Object.values(UserRole).includes(role as UserRole)) {
    return invalid('Nieprawidłowa rola');
  }

  if (
    status &&
    !Object.values(AccountStatus).includes(status as AccountStatus)
  ) {
    return invalid('Nieprawidłowy status konta');
  }

  try {
    if (await findUserByEmail(email as string)) {
      logger.warn(
        { email },
        `User creation failed: ${email} already exists (attempted by ${session.user.email})`
      );
      return invalid(EMAIL_TAKEN_MESSAGE);
    }

    const hashedPassword = await bcrypt.hash(password as string, BCRYPT_COST);

    const user = await createAdminUser({
      email: email as string,
      hashedPassword,
      name: (name as string) || null,
      role: (role as UserRole) || UserRole.TENANT,
      status: (status as AccountStatus) || AccountStatus.PENDING,
    });

    return { ok: true, data: user };
  } catch (error) {
    logger.error({ error }, 'Failed to create user');
    return failed('Nie udało się utworzyć użytkownika');
  }
}
