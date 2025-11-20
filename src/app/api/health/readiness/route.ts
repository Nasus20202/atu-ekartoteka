import { NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api:health:readiness');

/**
 * Readiness probe endpoint
 * Indicates whether the application is ready to serve traffic
 * Checks all critical dependencies (database, etc.)
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const checks: Record<string, boolean> = {};
  let isReady = true;

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    checks.database = false;
    isReady = false;
    logger.error({ error }, 'Database readiness check failed');
  }

  const status = isReady ? 'ready' : 'not_ready';
  const statusCode = isReady ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp,
      checks,
    },
    { status: statusCode }
  );
}
