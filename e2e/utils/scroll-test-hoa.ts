/**
 * A temporary HOA with more apartments than one API page, for infinite
 * scrolling tests. Apartments have no email, so bulk management ignores them.
 */

import * as pg from 'pg';

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
    const hoa = await client.query(
      `INSERT INTO "HomeownersAssociation" (id, "externalId", name, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       RETURNING id`,
      [`SCROLL-${suffix}`, SCROLL_HOA_NAME]
    );
    const hoaId = hoa.rows[0].id as string;

    await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "createdAt", "updatedAt"
       )
       SELECT gen_random_uuid(), 'WS-' || $2 || '-' || n, 'S-' || $2 || '-' || n,
              'Scroll Owner ' || n, 'ul. Przewijana', '1', n::text,
              '00-001', 'Warszawa', n, 1000, n % 5 <> 0, $1, NOW(), NOW()
       FROM generate_series(1, $3::int) AS n`,
      [hoaId, suffix, count]
    );
    return hoaId;
  } finally {
    await client.end();
  }
}

export async function deleteScrollTestHoa(hoaId: string): Promise<void> {
  const client = connect();
  try {
    await client.connect();
    await client.query(
      `DELETE FROM "Apartment" WHERE "homeownersAssociationId" = $1`,
      [hoaId]
    );
    await client.query(`DELETE FROM "HomeownersAssociation" WHERE id = $1`, [
      hoaId,
    ]);
  } finally {
    await client.end();
  }
}
