import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { patchConsole } from '@/lib/logging/patch-console';

const original = {
  debug: console.debug,
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

function createLoggerMock() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe('patchConsole', () => {
  let logger: ReturnType<typeof createLoggerMock>;

  beforeEach(() => {
    logger = createLoggerMock();
    patchConsole(logger as never);
  });

  afterEach(() => {
    Object.assign(console, original);
  });

  it.each([
    ['debug', 'debug'],
    ['log', 'info'],
    ['info', 'info'],
    ['warn', 'warn'],
    ['error', 'error'],
  ] as const)('maps console.%s to the %s level', (method, level) => {
    console[method]('something happened', 42);

    expect(logger[level]).toHaveBeenCalledWith({}, 'something happened 42');
  });

  it('strips terminal colour codes', () => {
    console.warn('\u001B[33mwarning\u001B[39m: slow');

    expect(logger.warn).toHaveBeenCalledWith({}, 'warning: slow');
  });

  it('logs an Error as the error field with its message as text', () => {
    const error = new Error('boom');

    console.error(error);

    expect(logger.error).toHaveBeenCalledWith({ error }, 'boom');
  });

  it('redacts e-mail addresses from the text', () => {
    console.error('sending to jan@example.com failed');

    expect(logger.error).toHaveBeenCalledWith(
      {},
      'sending to [redacted-email] failed'
    );
  });

  it('logs an unknown Server Action ID at info instead of error', () => {
    const error = new Error(
      'The Server Reference ID did not match the expected format. Received "x".'
    );

    console.error(error);

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      { error },
      expect.stringContaining('Server Reference ID')
    );
  });

  it('matches the Server Action message when it is a plain string', () => {
    console.error(
      'Error: The Server Reference ID did not match the expected format. Received "x".'
    );

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledOnce();
  });

  it('logs a rejected Server Action origin at warn instead of error', () => {
    console.error('Error: Invalid Server Actions request.');

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      {},
      'Error: Invalid Server Actions request.'
    );
  });

  it('keeps unrelated errors at error level', () => {
    console.error('Error: Database readiness check failed');

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});
