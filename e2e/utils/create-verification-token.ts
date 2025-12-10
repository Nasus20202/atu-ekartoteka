/**
 * Create an unverified user and verification code for E2E testing.
 */

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as pg from 'pg';

import {
  UNVERIFIED_EMAIL,
  UNVERIFIED_PASSWORD,
  VERIFICATION_CODE,
} from './test-credentials';

/**
 * Hash a token using SHA-256 (same as verification-utils.ts)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createVerificationToken() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const passwordHash = await bcrypt.hash(UNVERIFIED_PASSWORD, 10);

    // Create or update unverified user
    const userResult = await client.query(
      `INSERT INTO "User" (id, email, password, name, role, status, "emailVerified", "authMethod", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'Unverified User', 'TENANT', 'PENDING', false, 'CREDENTIALS', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET password = $2, "emailVerified" = false, status = 'PENDING'
       RETURNING id`,
      [UNVERIFIED_EMAIL, passwordHash]
    );

    const userId = userResult.rows[0].id;

    // Delete existing verification code and create fresh one
    await client.query(`DELETE FROM "EmailVerification" WHERE "userId" = $1`, [
      userId,
    ]);

    const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash the verification code before storing (plain code is used in URL)
    const hashedCode = hashToken(VERIFICATION_CODE);

    await client.query(
      `INSERT INTO "EmailVerification" (id, code, "userId", "expiresAt", verified, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, false, NOW(), NOW())`,
      [hashedCode, userId, codeExpiry]
    );
  } finally {
    await client.end();
  }
}
