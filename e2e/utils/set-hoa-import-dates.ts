/**
 * Set or clear import date fields on the TEST01 HOA.
 *
 * Pass a Date (or ISO string) to set all three import dates to the same value,
 * or pass null to clear them.
 */

import * as pg from 'pg';

export async function setHoaImportDates(
  date: Date | string | null
): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(
      `UPDATE "HomeownersAssociation"
       SET "apartmentsDataDate"    = $1,
           "chargesDataDate"       = $1,
           "notificationsDataDate" = $1
       WHERE "externalId" = 'TEST01'`,
      [date]
    );
  } finally {
    await client.end();
  }
}
