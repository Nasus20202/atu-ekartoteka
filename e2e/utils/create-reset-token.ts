/**
 * Create a fresh password reset token for E2E testing.
 */

import * as crypto from 'crypto';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import { RESET_TOKEN, USER_EMAIL } from './test-credentials';

/**
 * Hash a token using SHA-256 (same as verification-utils.ts)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createResetToken() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    // Get the test user ID
    const userResult = await client.query(
      loadSql('select-user-id-by-email.sql'),
      [USER_EMAIL]
    );

    if (userResult.rows.length === 0) {
      throw new Error(`Test user ${USER_EMAIL} not found`);
    }

    const userId = userResult.rows[0].id;
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash the token before storing (plain token is used in URL)
    const hashedToken = hashToken(RESET_TOKEN);

    // Delete existing token and create fresh one
    await client.query(loadSql('delete-password-reset-by-token.sql'), [
      hashedToken,
    ]);

    await client.query(loadSql('insert-password-reset.sql'), [
      hashedToken,
      userId,
      resetExpiry,
    ]);
  } finally {
    await client.end();
  }
}
