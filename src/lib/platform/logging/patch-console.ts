import { format, stripVTControlCharacters } from 'node:util';

import type { Logger } from 'pino';

import { redactEmails } from '@/lib/platform/logging/redact';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type ConsoleMethod = 'debug' | 'log' | 'info' | 'warn' | 'error';

const METHOD_LEVELS: Record<ConsoleMethod, LogLevel> = {
  debug: 'debug',
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

// Next.js prints some conditions caused by the caller with console.error. The
// framework already rejects these requests. A malformed Server Action ID is
// routine internet noise, while a failed origin check stays a warning because a
// proxy misconfiguration produces the same message.
const LEVEL_OVERRIDES: ReadonlyArray<{ pattern: RegExp; level: LogLevel }> = [
  {
    pattern: /Server Reference ID did not match the expected format/,
    level: 'info',
  },
  {
    pattern: /Invalid Server Actions request/,
    level: 'warn',
  },
];

function emit(logger: Logger, defaultLevel: LogLevel, args: unknown[]): void {
  const [first, ...rest] = args;
  const error = first instanceof Error ? first : undefined;
  const text = stripVTControlCharacters(
    redactEmails(format(...(error ? [error.message, ...rest] : args)))
  ).trim();
  const level =
    LEVEL_OVERRIDES.find(({ pattern }) => pattern.test(text))?.level ??
    defaultLevel;

  logger[level](error ? { error } : {}, text);
}

/**
 * Routes console output, including the lines Next.js prints itself, through
 * pino so each one is a JSON record with a level instead of a raw stderr line.
 */
export function patchConsole(logger: Logger): void {
  for (const method of Object.keys(METHOD_LEVELS) as ConsoleMethod[]) {
    console[method] = (...args: unknown[]) =>
      emit(logger, METHOD_LEVELS[method], args);
  }
}
