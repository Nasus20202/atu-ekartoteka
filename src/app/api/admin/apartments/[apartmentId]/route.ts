import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api:admin:apartments:detail');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apartmentId } = await params;

    const apartment = await prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: {
        homeownersAssociation: {
          select: {
            id: true,
            externalId: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        charges: {
          orderBy: { period: 'desc' },
        },
        chargeNotifications: {
          orderBy: { lineNo: 'asc' },
        },
        payments: {
          orderBy: { year: 'desc' },
        },
      },
    });

    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(apartment);
  } catch (error) {
    logger.error({ error }, 'Error fetching apartment details');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
