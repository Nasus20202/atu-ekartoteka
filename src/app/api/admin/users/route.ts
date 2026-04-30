import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { updateUserStatus } from '@/lib/mutations/users/update-user-status';
import { notifyAccountApproved } from '@/lib/notifications/account-status';
import { findApartmentsByIds } from '@/lib/queries/apartments/find-apartments-by-ids';
import { findTenantUsers } from '@/lib/queries/users/find-tenant-users';
import { findUserById } from '@/lib/queries/users/find-user-by-id';
import { AccountStatus, UserRole } from '@/lib/types';
import { toUserDto } from '@/lib/types/dto/user-dto';

const logger = createLogger('api:admin:users');

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      logger.warn(
        { email: session?.user?.email || 'anonymous' },
        'Unauthorized user list access attempt'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');
    if (
      roleParam &&
      roleParam !== UserRole.ADMIN &&
      roleParam !== UserRole.TENANT
    ) {
      return NextResponse.json(
        { error: 'Nieprawidłowa rola' },
        { status: 400 }
      );
    }

    const role =
      roleParam === UserRole.ADMIN ? UserRole.ADMIN : UserRole.TENANT;
    const statusParam = searchParams.get('status');

    if (
      role !== UserRole.ADMIN &&
      statusParam &&
      !Object.values(AccountStatus).includes(statusParam as AccountStatus)
    ) {
      return NextResponse.json(
        { error: 'Nieprawidłowy status' },
        { status: 400 }
      );
    }

    const status =
      role === UserRole.ADMIN ? null : (statusParam as AccountStatus | null);
    const page = parsePositiveInteger(searchParams.get('page'), 1);
    const limit = Math.min(
      200,
      parsePositiveInteger(searchParams.get('limit'), 50)
    );
    const search = searchParams.get('search')?.trim() || null;

    const { users, total } = await findTenantUsers(
      status,
      page,
      limit,
      search,
      role
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
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      logger.warn(
        { email: session?.user?.email || 'anonymous' },
        'Unauthorized user update attempt'
      );
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

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
    if (
      status === AccountStatus.APPROVED &&
      apartmentIds &&
      apartmentIds.length > 0
    ) {
      const apartments = await findApartmentsByIds(apartmentIds);

      if (apartments.length !== apartmentIds.length) {
        return NextResponse.json(
          { error: 'Niektóre mieszkania nie zostały znalezione' },
          { status: 404 }
        );
      }

      const occupiedApartments = apartments.filter(
        (apt: (typeof apartments)[number]) => apt.user && apt.user.id !== userId
      );
      if (occupiedApartments.length > 0) {
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
      status === AccountStatus.APPROVED &&
      user.status !== AccountStatus.APPROVED &&
      updatedUser.role !== UserRole.ADMIN
    ) {
      await notifyAccountApproved(updatedUser.email, updatedUser.name);
    }

    return NextResponse.json({ user: toUserDto(updatedUser) });
  } catch (error) {
    logger.error({ error }, 'User update error');
    return NextResponse.json(
      {
        error: 'Nie udało się zaktualizować użytkownika',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
