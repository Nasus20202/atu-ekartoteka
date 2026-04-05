/**
 * Create (or reset) a test user with mustChangePassword=true.
 *
 * Used in change-password E2E tests. Resets the user's password and flag
 * before each test so the flow can be repeated without side-effects.
 */

import * as bcrypt from 'bcryptjs';
import * as pg from 'pg';

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

    await client.query(
      `INSERT INTO "User" (id, email, password, name, role, status, "emailVerified", "mustChangePassword", "authMethod", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'TENANT', 'APPROVED', true, true, 'CREDENTIALS', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE
         SET password = $2,
             "mustChangePassword" = true,
             "updatedAt" = NOW()`,
      [MUST_CHANGE_PASSWORD_EMAIL, passwordHash, MUST_CHANGE_PASSWORD_NAME]
    );
  } finally {
    await client.end();
  }
}
