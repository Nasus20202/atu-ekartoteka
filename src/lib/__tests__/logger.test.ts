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

  it('writes to stdout when test logs are enabled', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ENABLE_TEST_LOGS', 'true');
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    const { logger } = await loadLogger();
    logger.info('test message');

    expect(write).toHaveBeenCalledWith(expect.stringContaining('test message'));
    write.mockRestore();
  });
});

describe('logger redaction', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function emit(fn: (logger: import('pino').Logger) => void) {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ENABLE_TEST_LOGS', 'true');
    const lines: string[] = [];
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(((
      line: string
    ) => {
      lines.push(line);
      return true;
    }) as typeof process.stdout.write);
    const { createLogger } = await loadLogger();
    fn(createLogger('test'));
    write.mockRestore();
    return lines.join('');
  }

  it('censors personal fields at the top level and one level below', async () => {
    const output = await emit((log) =>
      log.info(
        { email: 'canary@example.com', nested: { to: 'canary2@example.com' } },
        'x'
      )
    );

    expect(output).not.toContain('canary');
    expect(output).toContain('[redacted]');
  });

  it('serializes errors without their message arguments', async () => {
    const output = await emit((log) =>
      log.error({ error: new Error('send to canary@example.com failed') }, 'x')
    );

    expect(output).not.toContain('canary@example.com');
    expect(output).toContain('[redacted-email]');
  });
});
