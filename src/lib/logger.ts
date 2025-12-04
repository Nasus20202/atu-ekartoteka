import { context, trace } from '@opentelemetry/api';
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Add OpenTelemetry trace/span IDs to every log entry (if available)
function otelMixin() {
  const span = trace.getSpan(context.active());
  if (!span) return {};

  const spanCtx = span.spanContext();
  return {
    traceId: spanCtx.traceId,
    spanId: spanCtx.spanId,
  };
}

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  enabled: !isTest || process.env.ENABLE_TEST_LOGS === 'true',
  browser: {
    asObject: true,
  },
  mixin: otelMixin,
});

// Create child loggers with contextual metadata
export const createLogger = (context: string) => {
  return logger.child({ context });
};
