/**
 * Makes sure an E2E database exists on the server and has the current schema.
 * A fresh checkout then needs only a running PostgreSQL server.
 */

import { execFileSync } from 'child_process';
import * as pg from 'pg';

import { MAINTENANCE_DATABASE_NAME, withDatabaseName } from './database-urls';
import { loadSql } from './load-sql';

const SAFE_DATABASE_NAME = /^[a-z][a-z0-9_]*$/;

function databaseNameOf(connectionString: string): string {
  const name = new URL(connectionString).pathname.slice(1);
  if (!SAFE_DATABASE_NAME.test(name)) {
    throw new Error(`Unsupported E2E database name: "${name}"`);
  }
  return name;
}

async function createDatabaseIfMissing(connectionString: string) {
  const name = databaseNameOf(connectionString);
  const admin = new pg.Client({
    connectionString: withDatabaseName(
      connectionString,
      MAINTENANCE_DATABASE_NAME
    ),
  });

  await admin.connect();
  try {
    const existing = await admin.query(loadSql('select-database-exists.sql'), [
      name,
    ]);
    if (existing.rowCount === 0) {
      // The name is validated above, so quoting it is safe
      await admin.query(`CREATE DATABASE "${name}"`);
      console.log(`  - Created database ${name}`);
    }
  } finally {
    await admin.end();
  }
}

function applyMigrations(connectionString: string) {
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  });
}

export async function ensureDatabase(connectionString: string) {
  await createDatabaseIfMissing(connectionString);
  applyMigrations(connectionString);
}
