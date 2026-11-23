import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/framework/auth/require-admin';
import { toHoaListItemDto } from '@/lib/hoa/dto/hoa-dto';
import { findHoas } from '@/lib/hoa/queries/find-hoas';
import { createLogger } from '@/lib/platform/logging/logger';
import { getErrorMessage } from '@/lib/shared/utils/error-message';

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
