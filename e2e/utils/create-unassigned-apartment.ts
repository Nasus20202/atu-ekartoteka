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
const UNASSIGNED_EMAIL = 'unassigned@e2e-test.com';

/**
 * The bulk-create flow makes an account with the apartment's email, and the
 * creatable list hides apartments whose email already belongs to a user. A
 * retried or repeated run therefore has to remove that account again, or the
 * HOA never comes back to the page.
 */
async function removeInvitedAccount(client: pg.Client) {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM "User" WHERE email = $1`,
    [UNASSIGNED_EMAIL]
  );
  const userId = result.rows[0]?.id;

  if (!userId) return;

  await client.query(
    `UPDATE "Apartment" SET "userId" = NULL WHERE "userId" = $1`,
    [userId]
  );
  await client.query(`DELETE FROM "EmailVerification" WHERE "userId" = $1`, [
    userId,
  ]);
  await client.query(`DELETE FROM "PasswordReset" WHERE "userId" = $1`, [
    userId,
  ]);
  await client.query(`DELETE FROM "User" WHERE id = $1`, [userId]);
}

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

    await removeInvitedAccount(client);

    const result = await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner, email,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "userId", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, $2,
         'E2E Unassigned Owner', $3,
         'ul. Testowa', '1', '2B', '00-001', 'Warszawa',
         50.5, 1000, true,
         $4, NULL, NOW(), NOW()
       )
       ON CONFLICT ("externalOwnerId", "externalApartmentId")
       DO UPDATE SET "userId" = NULL, "updatedAt" = NOW()
       RETURNING id`,
      [
        UNASSIGNED_EXTERNAL_OWNER_ID,
        UNASSIGNED_EXTERNAL_APARTMENT_ID,
        UNASSIGNED_EMAIL,
        hoaId,
      ]
    );

    return result.rows[0].id as string;
  } finally {
    await client.end();
  }
}
