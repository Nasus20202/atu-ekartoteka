import { NextRequest, NextResponse } from 'next/server';

import { loadApartmentsPage } from '@/app/api/admin/apartments/load-apartments-page';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
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

    return NextResponse.json(
      await loadApartmentsPage({
        page,
        limit,
        hoaId,
        sort,
        order,
        search: searchParams.get('search')?.trim() ?? '',
        activeOnly: searchParams.get('activeOnly') === 'true',
        assignableTo: searchParams.get('assignableTo'),
      })
    );
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
