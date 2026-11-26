/**
 * Seed an existing user and a matching unassigned apartment for assign-existing E2E tests.
 *
 * Creates a tenant user + an unassigned apartment whose email matches that user.
 * Both records use a unique suffix to avoid conflicts across test runs.
 * Returns ids so callers can clean up if needed.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import { UNVERIFIED_PASSWORD } from './test-credentials';

export async function createUserWithUnassignedApartment(): Promise<{
  userId: string;
  apartmentId: string;
  email: string;
}> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();

    const hoaResult = await client.query(
      loadSql('select-hoa-id-by-external-id.sql'),
      ['TEST01']
    );
    const hoaId = hoaResult.rows[0]?.id;
    if (!hoaId)
      throw new Error('Test HOA (TEST01) not found — run global seed first');

    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const email = `assign-e2e-${uniqueSuffix}@e2e-test.com`;
    const passwordHash = await bcrypt.hash(UNVERIFIED_PASSWORD, 10);

    // Create user (tenant, approved, no mustChangePassword)
    const userResult = await client.query(loadSql('insert-tenant-user.sql'), [
      email,
      passwordHash,
      'E2E Assign Tenant',
    ]);
    const userId = userResult.rows[0].id as string;

    // Create unassigned apartment with matching email
    const aptResult = await client.query(
      loadSql('insert-unassigned-apartment.sql'),
      [
        `WA-${uniqueSuffix}`,
        `TEST01-ASSIGN-${uniqueSuffix}`,
        'E2E Assign Owner',
        email,
        '99Z',
        true,
        hoaId,
      ]
    );
    const apartmentId = aptResult.rows[0].id as string;

    return { userId, apartmentId, email };
  } finally {
    await client.end();
  }
}
