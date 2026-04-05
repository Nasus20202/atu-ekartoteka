/**
 * Seed an unassigned apartment for bulk-create E2E tests.
 *
 * Creates (or resets) a second apartment in the test HOA with no user
 * assigned, so the bulk-create page always has something to show.
 * Returns the apartment id.
 */

import * as pg from 'pg';

const UNASSIGNED_EXTERNAL_OWNER_ID = 'W00002';
const UNASSIGNED_EXTERNAL_APARTMENT_ID = 'TEST01-TEST01-00000-00002M';

export async function createUnassignedApartment(): Promise<string> {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    // Resolve the test HOA id
    const hoaResult = await client.query(
      `SELECT id FROM "HomeownersAssociation" WHERE "externalId" = 'TEST01'`
    );
    const hoaId = hoaResult.rows[0]?.id;

    if (!hoaId) {
      throw new Error('Test HOA (TEST01) not found — run global seed first');
    }

    const result = await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner, email,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "userId", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, $2,
         'E2E Unassigned Owner', 'unassigned@e2e-test.com',
         'ul. Testowa', '1', '2B', '00-001', 'Warszawa',
         50.5, 1000, true,
         $3, NULL, NOW(), NOW()
       )
       ON CONFLICT ("externalOwnerId", "externalApartmentId")
       DO UPDATE SET "userId" = NULL, "updatedAt" = NOW()
       RETURNING id`,
      [UNASSIGNED_EXTERNAL_OWNER_ID, UNASSIGNED_EXTERNAL_APARTMENT_ID, hoaId]
    );

    return result.rows[0].id as string;
  } finally {
    await client.end();
  }
}
