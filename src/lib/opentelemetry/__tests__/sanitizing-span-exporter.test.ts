import { describe, expect, it, vi } from 'vitest';

import {
  sanitizeSpanAttributes,
  withSanitizedSpans,
} from '@/lib/opentelemetry/sanitizing-span-exporter';

// The attributes @opentelemetry/instrumentation-http sets on a server span
// for GET /verify-email?token=abc123 behind a proxy.
function serverSpanAttributes(): Record<string, unknown> {
  return {
    'http.request.method': 'GET',
    'http.response.status_code': 200,
    'http.route': '/verify-email',
    'url.full': 'http://app.example/verify-email?token=abc123',
    'url.path': '/verify-email',
    'url.query': '?token=abc123',
    'url.scheme': 'http',
    'server.address': 'app.example',
    'client.address': '203.0.113.7',
    'network.peer.address': '10.0.0.5',
    'network.peer.port': 51234,
    'network.protocol.version': '1.1',
    'user_agent.original': 'Mozilla/5.0',
  };
}

describe('sanitizeSpanAttributes', () => {
  it('removes the query string and client addresses', () => {
    const span = { attributes: serverSpanAttributes() };

    sanitizeSpanAttributes(span);

    expect(JSON.stringify(span.attributes)).not.toContain('abc123');
    expect(JSON.stringify(span.attributes)).not.toContain('203.0.113.7');
    expect(JSON.stringify(span.attributes)).not.toContain('10.0.0.5');
    expect(span.attributes['url.full']).toBe('http://app.example/verify-email');
  });

  it('strips the query of the older URL attributes and drops header attributes', () => {
    const span = {
      attributes: {
        'http.url': 'http://app.example/a?token=x',
        'http.target': '/a?token=x',
        'http.client_ip': '203.0.113.7',
        'http.request.header.cookie': 'session=1',
      },
    };

    sanitizeSpanAttributes(span);

    expect(span.attributes).toEqual({
      'http.url': 'http://app.example/a',
      'http.target': '/a',
    });
  });

  it('keeps the attributes that carry no personal data', () => {
    const span = { attributes: serverSpanAttributes() };

    sanitizeSpanAttributes(span);

    expect(Object.keys(span.attributes).sort()).toMatchInlineSnapshot(`
      [
        "http.request.method",
        "http.response.status_code",
        "http.route",
        "network.peer.port",
        "network.protocol.version",
        "server.address",
        "url.full",
        "url.path",
        "url.scheme",
        "user_agent.original",
      ]
    `);
  });

  it('does not touch the span name', () => {
    const span = {
      name: 'GET /verify-email',
      attributes: serverSpanAttributes(),
    };

    sanitizeSpanAttributes(span);

    expect(span.name).toBe('GET /verify-email');
  });
});

describe('withSanitizedSpans', () => {
  it('sanitizes spans before handing them to the wrapped exporter', () => {
    const inner = {
      export: vi.fn(),
      shutdown: vi.fn().mockResolvedValue(undefined),
      forceFlush: vi.fn().mockResolvedValue(undefined),
    };
    const callback = vi.fn();
    const span = { attributes: serverSpanAttributes() };

    const exporter = withSanitizedSpans(inner);
    exporter.export([span], callback);

    expect(inner.export).toHaveBeenCalledWith([span], callback);
    expect(JSON.stringify(inner.export.mock.calls[0][0])).not.toContain(
      'abc123'
    );
  });

  it('delegates shutdown and flush', async () => {
    const inner = {
      export: vi.fn(),
      shutdown: vi.fn().mockResolvedValue(undefined),
      forceFlush: vi.fn().mockResolvedValue(undefined),
    };

    const exporter = withSanitizedSpans(inner);
    await exporter.shutdown();
    await exporter.forceFlush?.();

    expect(inner.shutdown).toHaveBeenCalled();
    expect(inner.forceFlush).toHaveBeenCalled();
  });
});
