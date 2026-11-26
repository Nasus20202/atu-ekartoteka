/**
 * Create (or reset) a test user with mustChangePassword=true.
 *
 * Used in change-password E2E tests. Resets the user's password and flag
 * before each test so the flow can be repeated without side-effects.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import {
  MUST_CHANGE_PASSWORD_EMAIL,
  MUST_CHANGE_PASSWORD_NAME,
  MUST_CHANGE_PASSWORD_PASSWORD,
} from './test-credentials';

export async function createMustChangePasswordUser() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const passwordHash = await bcrypt.hash(MUST_CHANGE_PASSWORD_PASSWORD, 10);

    await client.query(loadSql('upsert-must-change-password-user.sql'), [
      MUST_CHANGE_PASSWORD_EMAIL,
      passwordHash,
      MUST_CHANGE_PASSWORD_NAME,
    ]);
  } finally {
    await client.end();
  }
}
