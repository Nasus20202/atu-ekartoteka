/**
 * Delete a user and any apartments linked to that user/email.
 * Used in E2E tests to clean up temporary tenant fixtures.
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
    const userResult = await client.query(
      `SELECT id FROM "User" WHERE email = $1`,
      [email]
    );
    const userId = (userResult.rows[0]?.id as string | undefined) ?? null;

    const apartmentsResult = await client.query(
      `SELECT id FROM "Apartment" WHERE email = $1 OR "userId" = $2`,
      [email, userId]
    );
    const apartmentIds = apartmentsResult.rows.map((row) => row.id as string);

    if (apartmentIds.length > 0) {
      await client.query(
        `DELETE FROM "Charge" WHERE "apartmentId" = ANY($1::text[])`,
        [apartmentIds]
      );
      await client.query(
        `DELETE FROM "ChargeNotification" WHERE "apartmentId" = ANY($1::text[])`,
        [apartmentIds]
      );
      await client.query(
        `DELETE FROM "Payment" WHERE "apartmentId" = ANY($1::text[])`,
        [apartmentIds]
      );
      await client.query(`DELETE FROM "Apartment" WHERE id = ANY($1::text[])`, [
        apartmentIds,
      ]);
    }

    await client.query(`DELETE FROM "User" WHERE email = $1`, [email]);
  } finally {
    await client.end();
  }
}
