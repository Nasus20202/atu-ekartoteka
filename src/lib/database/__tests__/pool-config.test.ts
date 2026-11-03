import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DB_POOL_CONNECTION_TIMEOUT_MS,
  DEFAULT_DB_POOL_MAX,
  readDatabasePoolConfig,
} from '@/lib/database/pool-config';

describe('readDatabasePoolConfig', () => {
  it('uses the defaults when no variables are set', () => {
    expect(readDatabasePoolConfig({})).toEqual({
      max: DEFAULT_DB_POOL_MAX,
      connectionTimeoutMillis: DEFAULT_DB_POOL_CONNECTION_TIMEOUT_MS,
    });
  });

  it('reads the pool size and timeout from the environment', () => {
    expect(
      readDatabasePoolConfig({
        DATABASE_POOL_MAX: '25',
        DATABASE_POOL_CONNECTION_TIMEOUT_MS: '2000',
      })
    ).toEqual({ max: 25, connectionTimeoutMillis: 2000 });
  });

  it.each(['0', '-3', '2.5', 'ten', ''])(
    'falls back to the default for the invalid pool size %j',
    (value) => {
      expect(readDatabasePoolConfig({ DATABASE_POOL_MAX: value }).max).toBe(
        DEFAULT_DB_POOL_MAX
      );
    }
  );
});
