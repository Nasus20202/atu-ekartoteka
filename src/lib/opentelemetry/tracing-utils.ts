const K8S_NAMESPACE_NAME = 'k8s.namespace.name';
const K8S_POD_NAME = 'k8s.pod.name';
const IGNORED_PATHS = ['/api/health', '/_next'];
const UUID_SEGMENT =
  /\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
const CUID_SEGMENT = /\/c[a-z0-9]{20,}/gi;
const NUMERIC_SEGMENT = /\/\d+/g;
const DYNAMIC_SEGMENT_PLACEHOLDER = '/*';

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
