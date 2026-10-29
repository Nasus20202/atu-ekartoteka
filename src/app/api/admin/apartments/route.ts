import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { findApartmentsPaginated } from '@/lib/queries/apartments/find-apartments-paginated';
import {
  toApartmentSummaryDto,
  toHomeownersAssociationSummaryDto,
} from '@/lib/types/dto/apartment-dto';
import { compareApartmentsNaturally } from '@/lib/utils/apartment-sort';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:apartments');

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

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

    const [apartmentsData, total, hoa] = await findApartmentsPaginated({
      where,
      hoaId,
    });

    const sortedApartments = apartmentsData.sort(compareApartmentsNaturally);

    const apartments = sortedApartments.slice(skip, skip + limit);

    return NextResponse.json({
      apartments: apartments.map(toApartmentSummaryDto),
      hoa: hoa ? toHomeownersAssociationSummaryDto(hoa) : null,
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
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
