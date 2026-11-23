import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockInitTracing, mockInitializeCronJobs, mockInfo, mockPatchConsole } =
  vi.hoisted(() => ({
    mockInitTracing: vi.fn(),
    mockInitializeCronJobs: vi.fn(),
    mockInfo: vi.fn(),
    mockPatchConsole: vi.fn(),
  }));

vi.mock('@/lib/platform/opentelemetry/tracing', () => ({
  initTracing: mockInitTracing,
}));
vi.mock('@/lib/cron/use-cases/initialize-cron-jobs', () => ({
  initializeCronJobs: mockInitializeCronJobs,
}));
vi.mock('@/lib/platform/logging/patch-console', () => ({
  patchConsole: mockPatchConsole,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
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

  it('routes console output through pino in production', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NODE_ENV', 'production');

    await register();

    expect(mockPatchConsole).toHaveBeenCalledOnce();
  });

  it('leaves the console untouched outside production', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    await register();

    expect(mockPatchConsole).not.toHaveBeenCalled();
  });

  it('does nothing in the Edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await register();

    expect(mockInitTracing).not.toHaveBeenCalled();
    expect(mockInitializeCronJobs).not.toHaveBeenCalled();
  });
});
