import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:apartments');

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '20') || 20
    );
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const hoaId = searchParams.get('hoaId');

    const skip = (page - 1) * limit;

    // Handle search with "/" (e.g., "17/12" means building 17, number 12)
    let searchCondition = {};
    if (search) {
      if (search.includes('/')) {
        const [buildingPart, numberPart] = search.split('/');
        searchCondition = {
          AND: [
            buildingPart.trim()
              ? {
                  building: {
                    contains: buildingPart.trim(),
                    mode: 'insensitive' as const,
                  },
                }
              : {},
            numberPart.trim()
              ? {
                  number: {
                    contains: numberPart.trim(),
                    mode: 'insensitive' as const,
                  },
                }
              : {},
          ],
        };
      } else {
        searchCondition = {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { owner: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
            { building: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            {
              externalOwnerId: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              externalApartmentId: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        };
      }
    }

    const where = {
      AND: [
        hoaId ? { homeownersAssociationId: hoaId } : {},
        activeOnly ? { isActive: true } : {},
        searchCondition,
      ],
    };

    const [apartmentsData, total, hoa] = await Promise.all([
      prisma.apartment.findMany({
        where,
      }),
      prisma.apartment.count({ where }),
      hoaId
        ? prisma.homeownersAssociation.findUnique({
            where: { id: hoaId },
            select: { id: true, externalId: true, name: true },
          })
        : Promise.resolve(null),
    ]);

    // Sort apartments: by building asc, then by number numerically
    const sortedApartments = apartmentsData.sort((a: any, b: any) => {
      const buildingA = a.building || '';
      const buildingB = b.building || '';
      if (buildingA !== buildingB) {
        return buildingA.localeCompare(buildingB);
      }
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

    const apartments = sortedApartments.slice(skip, skip + limit);

    return NextResponse.json({
      apartments,
      hoa,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Apartments fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać mieszkań',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
