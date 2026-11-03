import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { findHoas } from '@/lib/queries/hoa/find-hoas';
import { toHoaListItemDto } from '@/lib/types/dto/hoa-dto';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:hoa');

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const homeownersAssociations = await findHoas(search);

    return NextResponse.json({
      homeownersAssociations: homeownersAssociations.map(toHoaListItemDto),
    });
  } catch (error) {
    logger.error({ error }, 'HOA fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać wspólnot',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
