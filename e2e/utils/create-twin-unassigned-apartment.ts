/**
 * Create an unassigned apartment that shares the same building+number as the
 * seeded apartment (building='1', number='1A') in the TEST01 HOA.
 *
 * This triggers the `hasTwinWithTenant` flag in the unassigned-apartments API
 * and the "Duplikat adresu" badge in the admin apartments list UI.
 *
 * Returns the apartment id (UUID) and externalOwnerId so callers can clean up.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

export async function createTwinUnassignedApartment(): Promise<{
  id: string;
  externalOwnerId: string;
}> {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const hoaResult = await client.query(
      loadSql('select-hoa-id-by-external-id.sql'),
      ['TEST01']
    );
    const hoaId = hoaResult.rows[0]?.id;

    if (!hoaId) {
      throw new Error('Test HOA (TEST01) not found — run global seed first');
    }

    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const externalOwnerId = `W99-TWIN-${uniqueSuffix}`;
    const externalApartmentId = `TEST01-TWIN-${uniqueSuffix}`;

    const result = await client.query(
      loadSql('insert-unassigned-apartment.sql'),
      [
        externalOwnerId,
        externalApartmentId,
        'E2E Twin Owner',
        `twin-${uniqueSuffix}@e2e-test.com`,
        '1A',
        true,
        hoaId,
      ]
    );

    return { id: result.rows[0].id as string, externalOwnerId };
  } finally {
    await client.end();
  }
}
