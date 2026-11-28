import { countApartmentAvailability } from '@/lib/apartments/queries/count-apartment-availability';
import { isApprovedStatus } from '@/lib/auth/rules/account-access';
import { isAdminRole } from '@/lib/auth/rules/admin-access';
import { AccountStatus } from '@/lib/auth/types/account';
import { createLogger } from '@/lib/platform/logging/logger';
import { authMetrics } from '@/lib/platform/opentelemetry/auth-metrics';
import {
  failedResult,
  invalidResult,
  notFoundResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { toUserDto, type UserDto } from '@/lib/users/dto/user-dto';
import { updateUserStatus } from '@/lib/users/mutations/update-user-status';
import { findUserById } from '@/lib/users/queries/find-user-by-id';
import { notifyAccountApproved } from '@/lib/users/use-cases/account-status';

const logger = createLogger('action:users');

/**
 * The values as the browser sent them. They are checked here by type, because
 * the order of the checks decides which message the admin sees.
 */
export interface UserStatusChange {
  adminId: string;
  userId: unknown;
  status: unknown;
  apartmentIds: unknown;
}

const isAccountStatus = (value: unknown): value is AccountStatus =>
  Object.values(AccountStatus).includes(value as AccountStatus);

export async function changeUserStatus({
  adminId,
  userId,
  status,
  apartmentIds,
}: UserStatusChange): Promise<UseCaseResult<{ user: UserDto }>> {
  logger.info(
    { adminId, userId, status },
    'Admin attempting to update user status'
  );

  if (!userId || !status || typeof userId !== 'string') {
    return invalidResult('Brak wymaganych pól');
  }

  if (
    apartmentIds !== undefined &&
    (!Array.isArray(apartmentIds) ||
      apartmentIds.some((apartmentId) => typeof apartmentId !== 'string'))
  ) {
    return invalidResult('Nieprawidłowa lista mieszkań');
  }

  if (!isAccountStatus(status)) {
    return invalidResult('Nieprawidłowy status');
  }

  // A repeated ID would make the count of existing apartments differ from the list length
  const nextApartmentIds = Array.isArray(apartmentIds)
    ? [...new Set<string>(apartmentIds)]
    : undefined;

  try {
    const user = await findUserById(userId);

    if (!user) return notFoundResult('Użytkownik nie znaleziony');

    if (
      isApprovedStatus(status) &&
      nextApartmentIds &&
      nextApartmentIds.length > 0
    ) {
      const { found, occupiedByOthers } = await countApartmentAvailability(
        nextApartmentIds,
        userId
      );

      if (found !== nextApartmentIds.length) {
        return notFoundResult('Niektóre mieszkania nie zostały znalezione');
      }

      if (occupiedByOthers > 0) {
        return invalidResult(
          'Niektóre mieszkania są już przypisane do innego użytkownika'
        );
      }
    }

    const updatedUser = await updateUserStatus({
      userId,
      status,
      apartmentIds: nextApartmentIds,
    });

    authMetrics.recordAccountStatusChange(status);
    logger.info(
      {
        adminId,
        userId,
        status,
        apartmentCount: updatedUser.apartments.length,
      },
      'User status updated'
    );

    // Notify only when the account was just approved
    if (
      isApprovedStatus(status) &&
      !isApprovedStatus(user.status) &&
      !isAdminRole(updatedUser.role)
    ) {
      await notifyAccountApproved(updatedUser.email, updatedUser.name);
    }

    return { ok: true, data: { user: toUserDto(updatedUser) } };
  } catch (error) {
    logger.error({ error }, 'User update error');
    return failedResult('Nie udało się zaktualizować użytkownika');
  }
}
