import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logger instance with browser-safe configuration
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Disable logging in test environment unless explicitly enabled
  enabled: !isTest || process.env.ENABLE_TEST_LOGS === 'true',
  browser: {
    asObject: true,
  },
});

// Helper to create child loggers with context
export const createLogger = (context: string) => {
  return logger.child({ context });
};
