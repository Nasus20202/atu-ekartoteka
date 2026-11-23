import { isSpanContextValid, trace } from '@opentelemetry/api';

/** Trace ID of the active span, or undefined when tracing is disabled. */
export function getActiveTraceId(): string | undefined {
  const spanContext = trace.getActiveSpan()?.spanContext();

  return spanContext && isSpanContextValid(spanContext)
    ? spanContext.traceId
    : undefined;
}
