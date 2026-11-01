import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { validateDatabase } from '@/lib/import/validate-database';
import { createLogger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:import:validate');

export const runtime = 'nodejs';

async function readSkipFullValidation(req: NextRequest): Promise<boolean> {
  const body = (await req.json().catch(() => ({}))) as {
    skipFullValidation?: boolean;
  };
  return body.skipFullValidation === true;
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireAdmin(
      'Unauthorized validation attempt'
    );
    if (response) return response;

    const skipFullValidation = await readSkipFullValidation(req);
    const result = await validateDatabase({ skipFullValidation });

    logger.info(
      {
        email: session.user.email,
        hoaCount: result.results.length,
        skipFullValidation,
      },
      'Database validation completed'
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Database validation error');
    return NextResponse.json(
      {
        error: 'Walidacja danych nie powiodła się',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
