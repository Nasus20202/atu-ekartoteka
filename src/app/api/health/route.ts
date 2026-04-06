import { NextResponse } from 'next/server';

import { checkDatabaseConnection } from '@/lib/database/health-check';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api:health');

/**
 * General health check endpoint
 * Checks both liveness and readiness
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const checks: Record<string, boolean> = {};
  let isHealthy = true;

  // Check database connection (readiness)
  const dbOk = await checkDatabaseConnection();
  checks.database = dbOk;
  if (!dbOk) {
    isHealthy = false;
    logger.error('Database health check failed');
  }

  // Application is alive (liveness)
  checks.application = true;

  const status = isHealthy ? 'healthy' : 'unhealthy';
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp,
      checks,
    },
    { status: statusCode }
  );
}
