/**
 * Set or clear the saved privacy policy directly in the database, so a spec can
 * start from a known state without clicking through the settings dialog.
 */

import * as pg from 'pg';

export async function setPrivacyPolicy(text: string | null) {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO "AppSettings" (id, "privacyPolicy", "updatedAt")
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET "privacyPolicy" = $1, "updatedAt" = NOW()`,
      [text]
    );
  } finally {
    await client.end();
  }
}
