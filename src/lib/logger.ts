import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  enabled: !isTest || process.env.ENABLE_TEST_LOGS === 'true',
  browser: {
    asObject: true,
  },
  formatters: {
    // Expose trace_id and span_id at the top level for visibility
    bindings: (bindings) => {
      return bindings;
    },
    level: (label) => {
      return { level: label };
    },
  },
});

// Create child loggers with contextual metadata
export const createLogger = (context: string) => {
  return logger.child({ context });
};
