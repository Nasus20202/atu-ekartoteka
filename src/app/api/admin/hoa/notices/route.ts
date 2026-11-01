import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { findHoaNotices } from '@/lib/queries/hoa/find-hoa-notices';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:hoa:notices');

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const homeownersAssociations = await findHoaNotices();

    return NextResponse.json({ homeownersAssociations });
  } catch (error) {
    logger.error({ error }, 'HOA notices fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać nagłówków i stopek wspólnot',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
