import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { validateDatabase } from '@/lib/import/validate-database';
import { createLogger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:import:validate');

export const runtime = 'nodejs';

export async function POST() {
  try {
    const { session, response } = await requireAdmin(
      'Unauthorized validation attempt'
    );
    if (response) return response;

    const result = await validateDatabase();

    logger.info(
      { email: session.user.email, hoaCount: result.results.length },
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
