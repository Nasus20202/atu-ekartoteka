/**
 * Next.js Instrumentation Hook
 * This file runs once when the Node.js server starts
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * IMPORTANT: This ONLY runs on the server, never on the client
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('instrumentation');

export async function register() {
  // Double-check we're on Node.js server (not Edge runtime or client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('Server starting - initializing OpenTelemetry and cron');

    // Initialize OpenTelemetry tracing first (if collector endpoint is configured)
    const { initTracing } = await import('@/lib/tracing');
    await initTracing();

    // Dynamic import to ensure this code only runs on server
    const { initializeCronJobs } = await import('@/lib/cron/init');

    initializeCronJobs();

    logger.info('Server initialization complete');
  }
}
