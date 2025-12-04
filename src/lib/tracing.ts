/**
 * OpenTelemetry Configuration
 *
 * Initializes OpenTelemetry with traces, metrics, and logs.
 * Includes HTTP and Prisma/PostgreSQL instrumentation.
 * Only activates if OTEL_EXPORTER_ENDPOINT env variable is set.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('otel');

export async function initTracing() {
  const collectorEndpoint = process.env.OTEL_EXPORTER_ENDPOINT;

  if (!collectorEndpoint) {
    logger.info('OTEL_EXPORTER_ENDPOINT not set, skipping OpenTelemetry');
    return;
  }

  logger.info({ endpoint: collectorEndpoint }, 'Initializing OpenTelemetry');

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { OTLPTraceExporter } =
    await import('@opentelemetry/exporter-trace-otlp-http');
  const { OTLPMetricExporter } =
    await import('@opentelemetry/exporter-metrics-otlp-http');
  const { OTLPLogExporter } =
    await import('@opentelemetry/exporter-logs-otlp-http');
  const { PeriodicExportingMetricReader } =
    await import('@opentelemetry/sdk-metrics');
  const { BatchLogRecordProcessor } = await import('@opentelemetry/sdk-logs');
  const { HttpInstrumentation } =
    await import('@opentelemetry/instrumentation-http');
  const { RuntimeNodeInstrumentation } =
    await import('@opentelemetry/instrumentation-runtime-node');

  const serviceName = process.env.OTEL_SERVICE_NAME || 'atu-ekartoteka';

  const sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({
      url: `${collectorEndpoint}/v1/traces`,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${collectorEndpoint}/v1/metrics`,
      }),
      exportIntervalMillis: 60000, // Export metrics every 60 seconds
    }),
    logRecordProcessors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `${collectorEndpoint}/v1/logs`,
        })
      ),
    ],
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => {
          // Ignore health check and Next.js internal endpoints
          const url = request.url || '';
          return url.includes('/api/health') || url.includes('/_next');
        },
        requestHook: (span, request) => {
          // Customize span name to include method and normalized path
          const url = 'url' in request ? request.url : undefined;
          const method = 'method' in request ? request.method : 'HTTP';
          if (url) {
            // Normalize dynamic segments (UUIDs, CUIDs, numeric IDs) to *
            const normalizedPath = url
              .split('?')[0] // Remove query string
              .replace(
                /\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
                '/*'
              ) // UUID
              .replace(/\/c[a-z0-9]{20,}/gi, '/*') // CUID (like cmiqi2top0006x0ko...)
              .replace(/\/\d+/g, '/*'); // Numeric IDs
            span.updateName(`${method} ${normalizedPath}`);
          }
        },
      }),
      new RuntimeNodeInstrumentation(),
    ],
  });

  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => logger.info('OpenTelemetry SDK shut down successfully'))
      .catch((error) =>
        logger.error({ error }, 'Error shutting down OpenTelemetry SDK')
      )
      .finally(() => process.exit(0));
  });

  logger.info('OpenTelemetry initialized (traces, metrics, logs)');
}
