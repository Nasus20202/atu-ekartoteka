/** Create a user who has not verified their email and holds no code yet. */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import { E2E_PASSWORD } from './test-credentials';

const BCRYPT_ROUNDS = 10;

export async function createUnverifiedUser(email: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(loadSql('upsert-unverified-user.sql'), [
      email,
      await bcrypt.hash(E2E_PASSWORD, BCRYPT_ROUNDS),
    ]);
  } finally {
    await client.end();
  }
}
