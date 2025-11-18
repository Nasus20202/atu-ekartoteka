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
        apartment: true,
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
    const { userId, status, apartmentId } = body;

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

    // If approving and apartment is provided, check if apartment is available
    if (status === AccountStatus.APPROVED && apartmentId) {
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId },
        include: { user: true },
      });

      if (!apartment) {
        return NextResponse.json(
          { error: 'Mieszkanie nie znalezione' },
          { status: 404 }
        );
      }

      if (apartment.user && apartment.user.id !== userId) {
        return NextResponse.json(
          { error: 'Mieszkanie jest już przypisane do innego użytkownika' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        apartmentId:
          status === AccountStatus.APPROVED ? apartmentId || null : null,
      },
      include: {
        apartment: true,
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
