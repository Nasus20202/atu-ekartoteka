/**
 * Rejected users sharing a unique email prefix, so a search for the prefix
 * returns more users than one API page without touching other tests' lists.
 * They are backdated so they sort after every other user.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

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
    await client.query(loadSql('insert-scroll-users.sql'), [prefix, count]);
    return prefix;
  } finally {
    await client.end();
  }
}

export async function deleteScrollTestUsers(prefix: string): Promise<void> {
  const client = connect();
  try {
    await client.connect();
    await client.query(loadSql('cleanup-users-by-email-prefix.sql'), [
      `${prefix}-%`,
    ]);
  } finally {
    await client.end();
  }
}
