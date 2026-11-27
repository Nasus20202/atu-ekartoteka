/**
 * A temporary association of one voting spec, for what other specs' votings in
 * the shared test HOA would disturb: counts, lists of voters, empty lists.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export interface VotingHoa {
  hoaId: string;
  /** Also its name */
  externalId: string;
}

async function withClient<T>(work: (client: pg.Client) => Promise<T>) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

export function createVotingHoa(): Promise<VotingHoa> {
  // Unique, because every worker and retry seeds its own association
  const random = Math.floor(Math.random() * 1000);
  const externalId = `TESTV${Date.now().toString(36)}${random}`.toUpperCase();
  return withClient(async (client) => {
    const hoa = await client.query(loadSql('upsert-test-hoa.sql'), [
      externalId,
    ]);
    return { hoaId: hoa.rows[0].id as string, externalId };
  });
}

/** Votings and ballots go with it; the global cleanup removes the accounts. */
export function deleteVotingHoa({ hoaId }: VotingHoa): Promise<void> {
  return withClient(async (client) => {
    await client.query(loadSql('cleanup-hoa-apartments.sql'), [hoaId]);
    await client.query(loadSql('cleanup-hoa.sql'), [hoaId]);
  });
}
