/**
 * A temporary HOA with more apartments than one API page, for infinite
 * scrolling tests. Apartments have no email, so bulk management ignores them.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export const SCROLL_HOA_NAME = 'E2E Scroll HOA';

function connect() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  return new pg.Client({ connectionString: dbUrl });
}

/**
 * Creates the HOA with apartments numbered 1..count and returns its id.
 * Shares grow with the number and every fifth apartment is inactive, so tests
 * can check that sorting and filtering happen in the database, not in the page.
 */
export async function createScrollTestHoa(count: number): Promise<string> {
  const client = connect();
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  try {
    await client.connect();
    const hoa = await client.query(loadSql('insert-scroll-hoa.sql'), [
      `SCROLL-${suffix}`,
      SCROLL_HOA_NAME,
    ]);
    const hoaId = hoa.rows[0].id as string;

    await client.query(loadSql('insert-scroll-apartments.sql'), [
      hoaId,
      suffix,
      count,
    ]);
    return hoaId;
  } finally {
    await client.end();
  }
}

export async function deleteScrollTestHoa(hoaId: string): Promise<void> {
  const client = connect();
  try {
    await client.connect();
    await client.query(loadSql('cleanup-hoa-apartments.sql'), [hoaId]);
    await client.query(loadSql('cleanup-hoa.sql'), [hoaId]);
  } finally {
    await client.end();
  }
}
