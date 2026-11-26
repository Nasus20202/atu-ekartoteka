/**
 * Two extra HOAs for the HOA reordering tests, named so they sort before the
 * seeded one and the three always fit on the first screen.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export const REORDER_HOA_FIRST = 'Aaa Kolejność Pierwsza';
export const REORDER_HOA_SECOND = 'Aaa Kolejność Druga';

const REORDER_HOAS = [
  { externalId: 'TEST_REORDER1', name: REORDER_HOA_FIRST },
  { externalId: 'TEST_REORDER2', name: REORDER_HOA_SECOND },
];

export async function createReorderHoas(): Promise<string[]> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const ids: string[] = [];
    for (const { externalId, name } of REORDER_HOAS) {
      const result = await client.query(loadSql('insert-scroll-hoa.sql'), [
        externalId,
        name,
      ]);
      ids.push(result.rows[0].id);
    }
    return ids;
  } finally {
    await client.end();
  }
}

export async function deleteReorderHoas(ids: string[]): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    for (const id of ids) {
      await client.query(loadSql('cleanup-hoa.sql'), [id]);
    }
  } finally {
    await client.end();
  }
}
