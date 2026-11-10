import pino from 'pino';

import { REDACTED_VALUE } from '@/lib/logging/redact';
import { serializeError } from '@/lib/logging/serialize-error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const testLogsEnabled = process.env.ENABLE_TEST_LOGS === 'true';
const isTestRun = process.env.VITEST === 'true';

// Fields that must never reach a log line. This is a backstop for a mistake
// that slips past review and the local/no-personal-data-in-logs lint rule.
const CENSORED_FIELDS = ['email', 'to', 'name', 'password', 'token'];
const REDACT_PATHS = CENSORED_FIELDS.flatMap((field) => [field, `*.${field}`]);

const options = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  enabled: !isTest || testLogsEnabled,
  browser: {
    asObject: true,
  },
  serializers: {
    error: serializeError,
    err: serializeError,
  },
  redact: { paths: REDACT_PATHS, censor: REDACTED_VALUE },
  formatters: {
    // Expose trace_id and span_id at the top level for visibility
    bindings: (bindings: Record<string, unknown>) => {
      return bindings;
    },
    level: (label: string) => {
      return { level: label };
    },
  },
};

// pino's default destination is a SonicBoom stream registered with
// on-exit-leak-free. Those records outlive the Vitest VM context and throw
// "process is not defined" during teardown, so test runs — including the ones
// that stub NODE_ENV to exercise the dev/prod config — write to a plain
// destination that registers nothing.
const testDestination = testLogsEnabled
  ? { write: (line: string) => process.stdout?.write(line) }
  : { write() {} };

export const logger = isTestRun
  ? pino(options, testDestination)
  : pino(options);

// Create child loggers with contextual metadata
export const createLogger = (context: string) => {
  return logger.child({ context });
};
