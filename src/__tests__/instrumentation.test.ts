import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockInitTracing, mockInitializeCronJobs, mockInfo } = vi.hoisted(
  () => ({
    mockInitTracing: vi.fn(),
    mockInitializeCronJobs: vi.fn(),
    mockInfo: vi.fn(),
  })
);

vi.mock('@/lib/opentelemetry/tracing', () => ({
  initTracing: mockInitTracing,
}));
vi.mock('@/lib/cron/init', () => ({
  initializeCronJobs: mockInitializeCronJobs,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: mockInfo }),
}));

import { register } from '@/instrumentation';

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('initialises tracing and cron jobs in the Node.js runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    await register();

    expect(mockInitTracing).toHaveBeenCalledOnce();
    expect(mockInitializeCronJobs).toHaveBeenCalledOnce();
    expect(mockInitTracing.mock.invocationCallOrder[0]).toBeLessThan(
      mockInitializeCronJobs.mock.invocationCallOrder[0]
    );
  });

  it('does nothing in the Edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await register();

    expect(mockInitTracing).not.toHaveBeenCalled();
    expect(mockInitializeCronJobs).not.toHaveBeenCalled();
  });
});
