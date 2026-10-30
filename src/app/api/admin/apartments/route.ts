import { NextRequest, NextResponse } from 'next/server';

import { buildApartmentsWhere } from '@/app/api/admin/apartments/apartments-where';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { findApartmentsPaginated } from '@/lib/queries/apartments/find-apartments-paginated';
import {
  toApartmentSummaryDto,
  toHomeownersAssociationSummaryDto,
} from '@/lib/types/dto/apartment-dto';
import { getErrorMessage } from '@/lib/utils/error-message';
import type { ApartmentSortKey, SortDirection } from '@/lib/utils/sort';

const logger = createLogger('api:admin:apartments');

const SORT_KEYS: readonly ApartmentSortKey[] = [
  'label',
  'owner',
  'share',
  'status',
];

function parseSortKey(value: string | null): ApartmentSortKey | undefined {
  return SORT_KEYS.find((key) => key === value);
}

function parseOrder(value: string | null): SortDirection {
  return value === 'desc' ? 'desc' : 'asc';
}

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
    const hoaId = searchParams.get('hoaId');
    const sort = parseSortKey(searchParams.get('sort'));
    const order = parseOrder(searchParams.get('order'));
    const skip = (page - 1) * limit;

    const where = buildApartmentsWhere({
      search: searchParams.get('search')?.trim() ?? '',
      activeOnly: searchParams.get('activeOnly') === 'true',
      hoaId,
      assignableTo: searchParams.get('assignableTo'),
    });

    const [apartments, total, hoa] = await findApartmentsPaginated({
      where,
      skip,
      limit,
      hoaId,
      sort,
      order,
    });

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
