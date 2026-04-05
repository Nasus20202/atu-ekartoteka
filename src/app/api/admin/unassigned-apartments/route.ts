import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:unassigned-apartments');

const UNASSIGNED_MODE_CREATABLE = 'creatable';
const UNASSIGNED_MODE_ASSIGNABLE = 'assignable';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('mode') ?? UNASSIGNED_MODE_CREATABLE;

    const existingUsers = await prisma.user.findMany({
      select: { email: true },
      where: { email: { not: undefined } },
    });
    const existingEmails = existingUsers
      .map((u) => u.email)
      .filter((e): e is string => e !== null);

    // assignable: apartments whose email matches an existing user
    // creatable (default): apartments whose email is NOT yet used by any user
    const emailWhere =
      mode === UNASSIGNED_MODE_ASSIGNABLE
        ? { in: existingEmails }
        : { notIn: existingEmails };

    const apartments = await prisma.apartment.findMany({
      where: {
        userId: null,
        email: { not: null, ...emailWhere },
      },
      select: {
        id: true,
        number: true,
        building: true,
        owner: true,
        email: true,
        homeownersAssociation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { homeownersAssociation: { name: 'asc' } },
        { building: 'asc' },
        { number: 'asc' },
      ],
    });

    // Group by HOA
    const hoaMap = new Map<
      string,
      { hoaId: string; hoaName: string; apartments: typeof apartments }
    >();

    for (const apt of apartments) {
      const hoaId = apt.homeownersAssociation.id;
      if (!hoaMap.has(hoaId)) {
        hoaMap.set(hoaId, {
          hoaId,
          hoaName: apt.homeownersAssociation.name,
          apartments: [],
        });
      }
      hoaMap.get(hoaId)!.apartments.push(apt);
    }

    logger.info(
      { hoaCount: hoaMap.size, apartmentCount: apartments.length, mode },
      'Fetched unassigned apartments'
    );

    return NextResponse.json({ hoas: Array.from(hoaMap.values()) });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch unassigned apartments');
    return NextResponse.json(
      { error: 'Failed to fetch unassigned apartments' },
      { status: 500 }
    );
  }
}
