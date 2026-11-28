const K8S_NAMESPACE_NAME = 'k8s.namespace.name';
const K8S_POD_NAME = 'k8s.pod.name';
const IGNORED_PATHS = ['/api/health', '/_next'];
const UUID_SEGMENT =
  /\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
const CUID_SEGMENT = /\/c[a-z0-9]{20,}/gi;
const NUMERIC_SEGMENT = /\/\d+/g;
const DYNAMIC_SEGMENT_PLACEHOLDER = '/*';
const DEFAULT_METRIC_EXPORT_INTERVAL_MS = 60_000;
const MAX_METRIC_EXPORT_TIMEOUT_MS = 30_000;

export interface MetricExportOptions {
  exportIntervalMillis: number;
  exportTimeoutMillis: number;
}

/**
 * Metric push schedule from the standard OTEL_METRIC_EXPORT_INTERVAL (ms). The
 * reader refuses a timeout longer than the interval, so the timeout follows it.
 */
export function metricExportOptions(
  env: Record<string, string | undefined>
): MetricExportOptions {
  const requested = Number(env.OTEL_METRIC_EXPORT_INTERVAL);
  const exportIntervalMillis =
    Number.isInteger(requested) && requested > 0
      ? requested
      : DEFAULT_METRIC_EXPORT_INTERVAL_MS;

  return {
    exportIntervalMillis,
    exportTimeoutMillis: Math.min(
      exportIntervalMillis,
      MAX_METRIC_EXPORT_TIMEOUT_MS
    ),
  };
}

export function shouldIgnoreRequest(url: string | undefined): boolean {
  const path = url || '';
  return IGNORED_PATHS.some((ignored) => path.includes(ignored));
}

export function normalizeSpanPath(url: string): string {
  return url
    .split('?')[0]
    .replace(UUID_SEGMENT, DYNAMIC_SEGMENT_PLACEHOLDER)
    .replace(CUID_SEGMENT, DYNAMIC_SEGMENT_PLACEHOLDER)
    .replace(NUMERIC_SEGMENT, DYNAMIC_SEGMENT_PLACEHOLDER);
}

export function buildResourceAttributes(
  serviceVersionKey: string,
  version: string,
  env: Record<string, string | undefined>
): Record<string, string> {
  const attributes: Record<string, string> = { [serviceVersionKey]: version };

  if (env.K8S_NAMESPACE) {
    attributes[K8S_NAMESPACE_NAME] = env.K8S_NAMESPACE;
  }

  if (env.K8S_POD_NAME) {
    attributes[K8S_POD_NAME] = env.K8S_POD_NAME;
  }

  return attributes;
}

export function mergeResourceAttributes(
  existing: string | undefined,
  attributes: Record<string, string>
): string {
  return [
    existing,
    ...Object.entries(attributes).map(([key, value]) => `${key}=${value}`),
  ]
    .filter(Boolean)
    .join(',');
}
