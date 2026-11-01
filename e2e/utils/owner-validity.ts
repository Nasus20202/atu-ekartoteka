/**
 * Read the apartment rows of an imported HOA, for owner validity tests.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export interface OwnerRow {
  id: string;
  homeownersAssociationId: string;
  externalOwnerId: string;
  isActive: boolean;
  validFrom: Date | null;
  validTo: Date | null;
}

function getDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  return dbUrl;
}

export async function readOwnerRows(
  hoaExternalId: string
): Promise<OwnerRow[]> {
  const client = new pg.Client({ connectionString: getDatabaseUrl() });
  try {
    await client.connect();
    const result = await client.query<OwnerRow>(
      loadSql('select-owner-rows.sql'),
      [hoaExternalId]
    );
    return result.rows;
  } finally {
    await client.end();
  }
}
