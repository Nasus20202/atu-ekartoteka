/**
 * Wraps a span exporter so spans leave the process without URL query strings
 * (single-use tokens travel there) and client or peer addresses.
 *
 * The key lists come from the attributes @opentelemetry/instrumentation-http
 * sets for server spans; the older semantic-convention names are included so a
 * downgrade or a different instrumentation cannot reintroduce them.
 */
const URL_ATTRIBUTES = ['url.full', 'http.url', 'http.target'] as const;
const DROPPED_ATTRIBUTES = [
  'url.query',
  'client.address',
  'network.peer.address',
  'http.client_ip',
  'net.peer.ip',
  'net.sock.peer.addr',
  'net.sock.host.addr',
] as const;
const DROPPED_ATTRIBUTE_PREFIXES = ['http.request.header.'] as const;

interface SpanLike {
  attributes: Record<string, unknown>;
}

interface ExporterLike<TSpan extends SpanLike, TResult> {
  export: (spans: TSpan[], resultCallback: (result: TResult) => void) => void;
  shutdown: () => Promise<void>;
  forceFlush?: () => Promise<void>;
}

function stripQuery(value: string): string {
  return value.split('?')[0];
}

export function sanitizeSpanAttributes(span: SpanLike): void {
  const { attributes } = span;

  for (const key of URL_ATTRIBUTES) {
    const value = attributes[key];
    if (typeof value === 'string') attributes[key] = stripQuery(value);
  }

  for (const key of Object.keys(attributes)) {
    if (
      (DROPPED_ATTRIBUTES as readonly string[]).includes(key) ||
      DROPPED_ATTRIBUTE_PREFIXES.some((prefix) => key.startsWith(prefix))
    ) {
      delete attributes[key];
    }
  }
}

export function withSanitizedSpans<TSpan extends SpanLike, TResult>(
  exporter: ExporterLike<TSpan, TResult>
): ExporterLike<TSpan, TResult> {
  return {
    export(spans, resultCallback) {
      spans.forEach(sanitizeSpanAttributes);
      exporter.export(spans, resultCallback);
    },
    shutdown: () => exporter.shutdown(),
    forceFlush: () => exporter.forceFlush?.() ?? Promise.resolve(),
  };
}
