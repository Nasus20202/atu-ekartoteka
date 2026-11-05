import pino from 'pino';

import { LOG_LEVEL } from './constants';

// The mock image ships only e2e/mocks, so it cannot reuse src/lib/logger.
// The output mirrors it: JSON lines with a textual `level` and a `name`.
const root = pino({
  level: LOG_LEVEL,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
});

export function createMockLogger(name: string) {
  return root.child({ name });
}
