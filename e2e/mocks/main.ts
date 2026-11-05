import { createMockLogger } from './logger';
import { startMockServer } from './server';

const log = createMockLogger('mock:main');

startMockServer().catch((error: unknown) => {
  log.error({ err: error }, 'mock server failed to start');
  process.exitCode = 1;
});
