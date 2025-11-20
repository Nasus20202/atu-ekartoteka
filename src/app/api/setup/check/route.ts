import { NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:setup:check');

export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
    });

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
