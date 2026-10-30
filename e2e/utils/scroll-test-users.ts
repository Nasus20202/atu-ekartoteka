/**
 * Rejected users sharing a unique email prefix, so a search for the prefix
 * returns more users than one API page without touching other tests' lists.
 * They are backdated so they sort after every other user.
 */

import * as pg from 'pg';

function connect() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  return new pg.Client({ connectionString: dbUrl });
}

/** Creates `count` rejected users and returns their shared email prefix. */
export async function createScrollTestUsers(count: number): Promise<string> {
  const prefix = `scroll-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const client = connect();
  try {
    await client.connect();
    await client.query(
      `INSERT INTO "User" (id, email, name, role, status, "emailVerified", "createdAt", "updatedAt")
       SELECT gen_random_uuid(), $1 || '-' || n || '@e2e-test.com', 'Scroll User ' || n,
              'TENANT', 'REJECTED', true,
              TIMESTAMP '2000-01-01' - n * INTERVAL '1 second', NOW()
       FROM generate_series(1, $2::int) AS n`,
      [prefix, count]
    );
    return prefix;
  } finally {
    await client.end();
  }
}

export async function deleteScrollTestUsers(prefix: string): Promise<void> {
  const client = connect();
  try {
    await client.connect();
    await client.query(`DELETE FROM "User" WHERE email LIKE $1`, [
      `${prefix}-%`,
    ]);
  } finally {
    await client.end();
  }
}
