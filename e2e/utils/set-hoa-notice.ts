/**
 * Set (or clear) the notification header and footer of a HOA.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export async function setHoaNotice(
  externalId: string,
  header: string | null,
  footer: string | null
): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(loadSql('update-hoa-notice.sql'), [
      externalId,
      header,
      footer,
    ]);
  } finally {
    await client.end();
  }
}
