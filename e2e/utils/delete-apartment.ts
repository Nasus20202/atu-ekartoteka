/**
 * Delete an apartment record by its UUID.
 *
 * Used in tests that create temporary apartments (e.g. twin/duplicate address)
 * and need to clean them up after the assertion.
 */

import * as pg from 'pg';

import { deleteSettlements } from './delete-settlements';
import { loadSql } from './load-sql';

export async function deleteApartment(id: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const ids = [id];
    await deleteSettlements(client, ids);
    await client.query(loadSql('delete-charges-by-apartments.sql'), [ids]);
    await client.query(
      loadSql('delete-charge-notifications-by-apartments.sql'),
      [ids]
    );
    await client.query(loadSql('delete-payments-by-apartments.sql'), [ids]);
    await client.query(loadSql('delete-apartments-by-ids.sql'), [ids]);
  } finally {
    await client.end();
  }
}
