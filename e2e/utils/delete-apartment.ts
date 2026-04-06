/**
 * Delete an apartment record by its UUID.
 *
 * Used in tests that create temporary apartments (e.g. twin/duplicate address)
 * and need to clean them up after the assertion.
 */

import * as pg from 'pg';

export async function deleteApartment(id: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(`DELETE FROM "Apartment" WHERE id = $1`, [id]);
  } finally {
    await client.end();
  }
}
