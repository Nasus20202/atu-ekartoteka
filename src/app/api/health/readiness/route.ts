import { NextResponse } from 'next/server';

import { checkDatabaseConnection } from '@/lib/database/health-check';
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

  // Check database connection
  const dbOk = await checkDatabaseConnection();
  checks.database = dbOk;
  if (!dbOk) {
    logger.error('Database readiness check failed');
  }

  const status = dbOk ? 'ready' : 'not_ready';
  const statusCode = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp,
      checks,
    },
    { status: statusCode }
  );
}
