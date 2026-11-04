import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetActiveSpan } = vi.hoisted(() => ({
  mockGetActiveSpan: vi.fn(),
}));

vi.mock('@opentelemetry/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@opentelemetry/api')>()),
  trace: { getActiveSpan: mockGetActiveSpan },
}));

import { getActiveTraceId } from '@/lib/opentelemetry/active-trace';

const VALID_TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';

describe('getActiveTraceId', () => {
  beforeEach(() => {
    mockGetActiveSpan.mockReset();
  });

  it('returns the trace ID of the active span', () => {
    mockGetActiveSpan.mockReturnValue({
      spanContext: () => ({
        traceId: VALID_TRACE_ID,
        spanId: '00f067aa0ba902b7',
        traceFlags: 1,
      }),
    });

    expect(getActiveTraceId()).toBe(VALID_TRACE_ID);
  });

  it('returns undefined when no span is active', () => {
    mockGetActiveSpan.mockReturnValue(undefined);

    expect(getActiveTraceId()).toBeUndefined();
  });

  it('returns undefined for an invalid span context', () => {
    mockGetActiveSpan.mockReturnValue({
      spanContext: () => ({
        traceId: '00000000000000000000000000000000',
        spanId: '0000000000000000',
        traceFlags: 0,
      }),
    });

    expect(getActiveTraceId()).toBeUndefined();
  });
});
