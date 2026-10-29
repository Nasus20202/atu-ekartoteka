import { describe, expect, it } from 'vitest';

import {
  buildResourceAttributes,
  mergeResourceAttributes,
  normalizeSpanPath,
  shouldIgnoreRequest,
} from '@/lib/opentelemetry/tracing-utils';

describe('shouldIgnoreRequest', () => {
  it.each(['/api/health', '/_next/static/chunk.js'])('ignores %s', (url) => {
    expect(shouldIgnoreRequest(url)).toBe(true);
  });

  it('keeps application requests and tolerates a missing url', () => {
    expect(shouldIgnoreRequest('/dashboard')).toBe(false);
    expect(shouldIgnoreRequest(undefined)).toBe(false);
  });
});

describe('normalizeSpanPath', () => {
  it('replaces dynamic segments and drops the query string', () => {
    expect(
      normalizeSpanPath(
        '/api/users/123e4567-e89b-12d3-a456-426614174000/apartments/cmiqi2top0006x0ko1234abcd/2025?page=2'
      )
    ).toBe('/api/users/*/apartments/*/*');
  });

  it('keeps static paths unchanged', () => {
    expect(normalizeSpanPath('/dashboard/charges')).toBe('/dashboard/charges');
  });
});

describe('buildResourceAttributes', () => {
  it('adds Kubernetes attributes when set', () => {
    expect(
      buildResourceAttributes('service.version', '1.0.0', {
        K8S_NAMESPACE: 'prod',
        K8S_POD_NAME: 'pod-1',
      })
    ).toEqual({
      'service.version': '1.0.0',
      'k8s.namespace.name': 'prod',
      'k8s.pod.name': 'pod-1',
    });
  });

  it('only sets the service version without Kubernetes variables', () => {
    expect(buildResourceAttributes('service.version', '1.0.0', {})).toEqual({
      'service.version': '1.0.0',
    });
  });
});

describe('mergeResourceAttributes', () => {
  it('appends attributes to existing ones', () => {
    expect(mergeResourceAttributes('env=prod', { a: '1', b: '2' })).toBe(
      'env=prod,a=1,b=2'
    );
  });

  it('skips missing existing attributes', () => {
    expect(mergeResourceAttributes(undefined, { a: '1' })).toBe('a=1');
  });
});
