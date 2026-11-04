import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockError, mockGetActiveTraceId } = vi.hoisted(() => ({
  mockError: vi.fn(),
  mockGetActiveTraceId: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: mockError, info: vi.fn() }),
}));
vi.mock('@/lib/opentelemetry/active-trace', () => ({
  getActiveTraceId: mockGetActiveTraceId,
}));

import { onRequestError } from '@/instrumentation';

const request = { path: '/dashboard' };

describe('onRequestError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
  });

  it('logs the digest with the trace ID when tracing is active', async () => {
    mockGetActiveTraceId.mockReturnValue('trace-123');

    await onRequestError(
      Object.assign(new Error('boom'), { digest: 'abc123' }),
      request
    );

    expect(mockError).toHaveBeenCalledWith(
      {
        digest: 'abc123',
        path: '/dashboard',
        error: 'boom',
        traceId: 'trace-123',
      },
      'Request failed'
    );
  });

  it('omits the trace ID when tracing is disabled', async () => {
    mockGetActiveTraceId.mockReturnValue(undefined);

    await onRequestError(
      Object.assign(new Error('boom'), { digest: 'abc123' }),
      request
    );

    expect(mockError.mock.calls[0][0]).not.toHaveProperty('traceId');
    expect(mockError.mock.calls[0][0]).toHaveProperty('digest', 'abc123');
  });

  it('does nothing in the Edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await onRequestError(new Error('boom'), request);

    expect(mockError).not.toHaveBeenCalled();
  });
});
