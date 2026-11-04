/**
 * Next.js Instrumentation Hook
 * This file runs once when the Node.js server starts
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * IMPORTANT: This ONLY runs on the server, never on the client
 * IMPORTANT: Logger must be imported AFTER OpenTelemetry SDK starts
 * so that PinoInstrumentation can hook into Pino properly.
 */

/**
 * Logs each failed request with its error digest, the ID the error page shows,
 * so a report can be matched to the trace when tracing is enabled.
 */
export async function onRequestError(
  error: Error & { digest?: string },
  request: { path: string }
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { getActiveTraceId } = await import('@/lib/opentelemetry/active-trace');
  const { createLogger } = await import('@/lib/logger');
  const logger = createLogger('request-error');
  const traceId = getActiveTraceId();

  logger.error(
    {
      digest: error.digest,
      path: request.path,
      error: error.message,
      ...(traceId ? { traceId } : {}),
    },
    'Request failed'
  );
}

export async function register() {
  // Double-check we're on Node.js server (not Edge runtime or client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize OpenTelemetry tracing FIRST (before any logger imports)
    const { initTracing } = await import('@/lib/opentelemetry/tracing');
    await initTracing();

    // Import logger AFTER OTel SDK starts so PinoInstrumentation can hook in
    const { createLogger } = await import('@/lib/logger');
    const logger = createLogger('instrumentation');

    logger.info('OpenTelemetry initialized');

    // Dynamic import to ensure this code only runs on server
    const { initializeCronJobs } = await import('@/lib/cron/init');

    initializeCronJobs();

    logger.info('Server initialization complete');
  }
}
