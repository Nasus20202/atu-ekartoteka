/**
 * Set or clear the saved privacy policy directly in the database, so a spec can
 * start from a known state without clicking through the settings dialog.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export async function setPrivacyPolicy(
  text: string | null,
  dbUrl = process.env.DATABASE_URL
) {
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();
    await client.query(loadSql('upsert-privacy-policy.sql'), [text]);
  } finally {
    await client.end();
  }
}
