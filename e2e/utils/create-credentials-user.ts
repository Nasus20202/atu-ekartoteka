/**
 * Create (or reset) an approved tenant that signs in with a password.
 *
 * Used by tests that need an account of their own, e.g. to delete it while
 * its session is still open.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';

const BCRYPT_ROUNDS = 10;

interface CredentialsUser {
  email: string;
  password: string;
  name: string;
}

export async function createCredentialsUser({
  email,
  password,
  name,
}: CredentialsUser): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await client.query(loadSql('upsert-regular-user.sql'), [
      email,
      passwordHash,
      name,
    ]);
  } finally {
    await client.end();
  }
}
