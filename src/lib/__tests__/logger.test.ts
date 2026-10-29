import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadLogger() {
  vi.resetModules();
  return import('@/lib/logger');
}

describe('logger', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is disabled in tests unless test logs are enabled', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ENABLE_TEST_LOGS', '');

    const { logger } = await loadLogger();

    expect(logger.isLevelEnabled('error')).toBe(false);
  });

  it('logs at debug level in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LOG_LEVEL', '');

    const { logger } = await loadLogger();

    expect(logger.level).toBe('debug');
  });

  it('logs at info level by default and honours LOG_LEVEL', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOG_LEVEL', '');
    expect((await loadLogger()).logger.level).toBe('info');

    vi.stubEnv('LOG_LEVEL', 'warn');
    expect((await loadLogger()).logger.level).toBe('warn');
  });

  it('creates child loggers with a context and enabled test logs', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ENABLE_TEST_LOGS', 'true');

    const { createLogger } = await loadLogger();
    const child = createLogger('test-context');

    expect(child.bindings()).toEqual({ context: 'test-context' });
    expect(child.isLevelEnabled('info')).toBe(true);
  });
});
