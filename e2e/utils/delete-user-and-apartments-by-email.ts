/**
 * Delete a user and any apartments linked to that user/email.
 * Used in E2E tests to clean up temporary tenant fixtures.
 */

import * as pg from 'pg';

import { deleteSettlements } from './delete-settlements';
import { loadSql } from './load-sql';

export async function deleteUserAndApartmentsByEmail(
  email: string
): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const userResult = await client.query(
      loadSql('select-user-id-by-email.sql'),
      [email]
    );
    const userId = (userResult.rows[0]?.id as string | undefined) ?? null;

    const apartmentsResult = await client.query(
      loadSql('select-apartment-ids-by-owner.sql'),
      [email, userId]
    );
    const apartmentIds = apartmentsResult.rows.map((row) => row.id as string);

    if (apartmentIds.length > 0) {
      await deleteSettlements(client, apartmentIds);
      await client.query(loadSql('delete-charges-by-apartments.sql'), [
        apartmentIds,
      ]);
      await client.query(
        loadSql('delete-charge-notifications-by-apartments.sql'),
        [apartmentIds]
      );
      await client.query(loadSql('delete-payments-by-apartments.sql'), [
        apartmentIds,
      ]);
      await client.query(loadSql('delete-apartments-by-ids.sql'), [
        apartmentIds,
      ]);
    }

    await client.query(loadSql('delete-user-by-email.sql'), [email]);
  } finally {
    await client.end();
  }
}
