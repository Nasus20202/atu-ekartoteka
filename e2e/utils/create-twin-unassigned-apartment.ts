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
      `SELECT id FROM "HomeownersAssociation" WHERE "externalId" = 'TEST01'`
    );
    const hoaId = hoaResult.rows[0]?.id;

    if (!hoaId) {
      throw new Error('Test HOA (TEST01) not found — run global seed first');
    }

    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const externalOwnerId = `W99-TWIN-${uniqueSuffix}`;
    const externalApartmentId = `TEST01-TWIN-${uniqueSuffix}`;

    const result = await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner, email,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "userId", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, $2,
         'E2E Twin Owner', $3,
         'ul. Testowa', '1', '1A', '00-001', 'Warszawa',
         50.5, 1000, true,
         $4, NULL, NOW(), NOW()
       )
       RETURNING id`,
      [
        externalOwnerId,
        externalApartmentId,
        `twin-${uniqueSuffix}@e2e-test.com`,
        hoaId,
      ]
    );

    return { id: result.rows[0].id as string, externalOwnerId };
  } finally {
    await client.end();
  }
}
