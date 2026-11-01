import { NextRequest, NextResponse } from 'next/server';

import { parseUsersQuery } from '@/app/api/admin/users/users-query';
import { isApprovedStatus } from '@/lib/auth/account-access';
import { isAdminRole } from '@/lib/auth/admin-access';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { updateUserStatus } from '@/lib/mutations/users/update-user-status';
import { notifyAccountApproved } from '@/lib/notifications/account-status';
import { countApartmentAvailability } from '@/lib/queries/apartments/count-apartment-availability';
import { findTenantUsers } from '@/lib/queries/users/find-tenant-users';
import { findUserById } from '@/lib/queries/users/find-user-by-id';
import { AccountStatus } from '@/lib/types';
import { toUserDto } from '@/lib/types/dto/user-dto';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:users');

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(
      'Unauthorized user list access attempt'
    );
    if (response) return response;

    const parsed = parseUsersQuery(new URL(req.url).searchParams);
    if (parsed.error !== undefined) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { role, status, page, limit, search, sort, order } = parsed.query;

    const { users, total } = await findTenantUsers(
      status,
      page,
      limit,
      search,
      role,
      sort ?? undefined,
      order
    );
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: users.map(toUserDto),
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    logger.error({ error }, 'Users fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać użytkowników',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, response } = await requireAdmin(
      'Unauthorized user update attempt'
    );
    if (response) return response;

    const body = await req.json();
    const { userId, status, apartmentIds } = body;

    logger.info(
      { adminEmail: session.user.email, userId, status },
      'Admin attempting to update user status'
    );

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Brak wymaganych pól' },
        { status: 400 }
      );
    }

    if (
      apartmentIds !== undefined &&
      (!Array.isArray(apartmentIds) ||
        apartmentIds.some((apartmentId) => typeof apartmentId !== 'string'))
    ) {
      return NextResponse.json(
        { error: 'Nieprawidłowa lista mieszkań' },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(AccountStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy status' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Użytkownik nie znaleziony' },
        { status: 404 }
      );
    }

    // If approving and apartments are provided, check if apartments are available
    if (isApprovedStatus(status) && apartmentIds && apartmentIds.length > 0) {
      const { found, occupiedByOthers } = await countApartmentAvailability(
        apartmentIds,
        userId
      );

      if (found !== apartmentIds.length) {
        return NextResponse.json(
          { error: 'Niektóre mieszkania nie zostały znalezione' },
          { status: 404 }
        );
      }

      if (occupiedByOthers > 0) {
        return NextResponse.json(
          {
            error:
              'Niektóre mieszkania są już przypisane do innego użytkownika',
          },
          { status: 400 }
        );
      }
    }

    // Update user and apartment assignments
    const updatedUser = await updateUserStatus({
      userId,
      status,
      apartmentIds,
    });

    logger.info(
      {
        adminEmail: session.user.email,
        userEmail: updatedUser.email,
        status,
        apartmentCount: updatedUser.apartments.length,
      },
      'User status updated'
    );

    // Send notification only if account was just approved (status changed from non-APPROVED to APPROVED)
    if (
      isApprovedStatus(status) &&
      !isApprovedStatus(user.status) &&
      !isAdminRole(updatedUser.role)
    ) {
      await notifyAccountApproved(updatedUser.email, updatedUser.name);
    }

    return NextResponse.json({ user: toUserDto(updatedUser) });
  } catch (error) {
    logger.error({ error }, 'User update error');
    return NextResponse.json(
      {
        error: 'Nie udało się zaktualizować użytkownika',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
