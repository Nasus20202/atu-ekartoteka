/**
 * Create a fresh password reset token for E2E testing.
 */

import * as pg from 'pg';

import { RESET_TOKEN, USER_EMAIL } from './test-credentials';

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
      `SELECT id FROM "User" WHERE email = $1`,
      [USER_EMAIL]
    );

    if (userResult.rows.length === 0) {
      throw new Error(`Test user ${USER_EMAIL} not found`);
    }

    const userId = userResult.rows[0].id;
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete existing token and create fresh one
    await client.query(`DELETE FROM "PasswordReset" WHERE token = $1`, [
      RESET_TOKEN,
    ]);

    await client.query(
      `INSERT INTO "PasswordReset" (id, token, "userId", "expiresAt", used, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, false, NOW(), NOW())`,
      [RESET_TOKEN, userId, resetExpiry]
    );
  } finally {
    await client.end();
  }
}
