/**
 * Seed an existing user and a matching unassigned apartment for assign-existing E2E tests.
 *
 * Creates a tenant user + an unassigned apartment whose email matches that user.
 * Both records use a unique suffix to avoid conflicts across test runs.
 * Returns ids so callers can clean up if needed.
 */

import * as bcrypt from 'bcryptjs';
import * as pg from 'pg';

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
      `SELECT id FROM "HomeownersAssociation" WHERE "externalId" = 'TEST01'`
    );
    const hoaId = hoaResult.rows[0]?.id;
    if (!hoaId)
      throw new Error('Test HOA (TEST01) not found — run global seed first');

    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const email = `assign-e2e-${uniqueSuffix}@e2e-test.com`;
    const passwordHash = await bcrypt.hash(UNVERIFIED_PASSWORD, 10);

    // Create user (tenant, approved, no mustChangePassword)
    const userResult = await client.query(
      `INSERT INTO "User" (
         id, email, name, password, role, status,
         "emailVerified", "mustChangePassword", "authMethod",
         "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, 'E2E Assign Tenant', $2,
         'TENANT', 'APPROVED', true, false, 'CREDENTIALS',
         NOW(), NOW()
       )
       RETURNING id`,
      [email, passwordHash]
    );
    const userId = userResult.rows[0].id as string;

    // Create unassigned apartment with matching email
    const aptResult = await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner, email,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "userId", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, $2, 'E2E Assign Owner', $3,
         'ul. Testowa', '1', '99Z', '00-001', 'Warszawa',
         50.5, 1000, true, $4, NULL, NOW(), NOW()
       )
       RETURNING id`,
      [`WA-${uniqueSuffix}`, `TEST01-ASSIGN-${uniqueSuffix}`, email, hoaId]
    );
    const apartmentId = aptResult.rows[0].id as string;

    return { userId, apartmentId, email };
  } finally {
    await client.end();
  }
}
