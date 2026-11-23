// pg's own defaults: 10 connections per pool, and no timeout while waiting
// for a free connection. A timeout makes requests fail fast instead of
// queueing until the proxy or browser gives up.
export const DEFAULT_DB_POOL_MAX = 10;
export const DEFAULT_DB_POOL_CONNECTION_TIMEOUT_MS = 5000;

export interface DatabasePoolConfig {
  max: number;
  connectionTimeoutMillis: number;
}

// Missing or invalid values (not a positive integer) use the default.
function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return value && Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Each Prisma client (primary and every read replica) has its own pool, so the
// total number of connections is the pool size times the number of clients.
export function readDatabasePoolConfig(
  env: Record<string, string | undefined> = process.env
): DatabasePoolConfig {
  return {
    max: readPositiveInteger(env.DATABASE_POOL_MAX, DEFAULT_DB_POOL_MAX),
    connectionTimeoutMillis: readPositiveInteger(
      env.DATABASE_POOL_CONNECTION_TIMEOUT_MS,
      DEFAULT_DB_POOL_CONNECTION_TIMEOUT_MS
    ),
  };
}
