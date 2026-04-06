/**
 * Delete a user and their unassigned apartments by email.
 * Used in assign-existing E2E tests to clean up after each test.
 */

import * as pg from 'pg';

export async function deleteUserAndApartmentsByEmail(
  email: string
): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(`DELETE FROM "User" WHERE email = $1`, [email]);
    await client.query(
      `DELETE FROM "Apartment" WHERE email = $1 AND "userId" IS NULL`,
      [email]
    );
  } finally {
    await client.end();
  }
}
