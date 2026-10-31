/**
 * Insert the standard three charge lines for an apartment in a single period.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export async function insertChargesForPeriod(
  apartmentId: string,
  year: number,
  monthIndex: number
): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(loadSql('insert-charges.sql'), [
      apartmentId,
      new Date(year, monthIndex, 1),
      new Date(year, monthIndex + 1, 0),
      `${year}${String(monthIndex + 1).padStart(2, '0')}`,
    ]);
  } finally {
    await client.end();
  }
}
