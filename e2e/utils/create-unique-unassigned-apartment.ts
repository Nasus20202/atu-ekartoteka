/**
 * Seed a uniquely-identified unassigned apartment for tests that need
 * to assign it to a user (e.g. admin-users.spec.ts).
 *
 * Unlike createUnassignedApartment(), this generates a new unique external ID
 * on every call so it never conflicts with the shared W00002 apartment used
 * by admin-bulk-create-users.spec.ts.
 *
 * Returns both the apartment id (UUID) and the generated externalOwnerId so
 * callers can clean up if needed.
 */

import * as pg from 'pg';

interface UniqueApartmentOptions {
  isActive?: boolean;
  number?: string;
}

export async function createUniqueUnassignedApartment({
  isActive = true,
  number = '2B',
}: UniqueApartmentOptions = {}): Promise<{
  id: string;
  externalOwnerId: string;
  email: string;
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
    const externalOwnerId = `W99-${uniqueSuffix}`;
    const externalApartmentId = `TEST01-UNIQUE-${uniqueSuffix}`;
    const email = `unique-${uniqueSuffix}@e2e-test.com`;

    const result = await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner, email,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "userId", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, $2,
         'E2E Unique Owner', $3,
         'ul. Testowa', '1', $5, '00-001', 'Warszawa',
         50.5, 1000, $6,
         $4, NULL, NOW(), NOW()
       )
       RETURNING id`,
      [externalOwnerId, externalApartmentId, email, hoaId, number, isActive]
    );

    return { id: result.rows[0].id as string, externalOwnerId, email };
  } finally {
    await client.end();
  }
}
