import { NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
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
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    checks.database = false;
    isHealthy = false;
    logger.error({ error }, 'Database health check failed');
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
