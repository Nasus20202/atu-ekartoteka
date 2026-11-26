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

import { loadSql } from './load-sql';

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
      loadSql('select-hoa-id-by-external-id.sql'),
      ['TEST01']
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
      loadSql('insert-unassigned-apartment.sql'),
      [
        externalOwnerId,
        externalApartmentId,
        'E2E Unique Owner',
        email,
        number,
        isActive,
        hoaId,
      ]
    );

    return { id: result.rows[0].id as string, externalOwnerId, email };
  } finally {
    await client.end();
  }
}
