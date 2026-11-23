import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/framework/auth/require-admin';
import { findHoaNotices } from '@/lib/hoa/queries/find-hoa-notices';
import { createLogger } from '@/lib/platform/logging/logger';
import { getErrorMessage } from '@/lib/shared/utils/error-message';

const logger = createLogger('api:admin:hoa:notices');

export async function GET() {
  try {
    const { response } = await requireAdmin('Unauthorized HOA notices attempt');
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
