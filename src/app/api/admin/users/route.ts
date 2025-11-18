import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { AccountStatus, UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as AccountStatus | null;

    const where = status
      ? { status, role: UserRole.TENANT }
      : { role: UserRole.TENANT };

    const users = await prisma.user.findMany({
      where,
      include: {
        apartments: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
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
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, status, apartmentIds } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Brak wymaganych pól' },
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

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
      const apartments = await prisma.apartment.findMany({
        where: { id: { in: apartmentIds } },
        include: { user: true },
      });

      if (apartments.length !== apartmentIds.length) {
        return NextResponse.json(
          { error: 'Niektóre mieszkania nie zostały znalezione' },
          { status: 404 }
        );
      }

      const occupiedApartments = apartments.filter(
        (apt) => apt.user && apt.user.id !== userId
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        apartments:
          status === AccountStatus.APPROVED && apartmentIds?.length
            ? {
                set: apartmentIds.map((id: string) => ({ id })),
              }
            : { set: [] },
      },
      include: {
        apartments: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      {
        error: 'Nie udało się zaktualizować użytkownika',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
