import { NextResponse } from 'next/server';

import { createLogger } from '@/lib/logger';
import { findFirstAdmin } from '@/lib/queries/users/find-first-admin';

const logger = createLogger('api:setup:check');

export async function GET() {
  try {
    const adminExists = await findFirstAdmin();

    logger.info({ adminExists: !!adminExists }, 'Checked if admin user exists');

    return NextResponse.json({
      needsSetup: !adminExists,
      hasAdmin: !!adminExists,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to check admin existence');
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}
