/**
 * Set up the state a bulk account action leaves behind, without going through
 * the UI: Server Actions have no stable URL a test could call directly.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import { UNVERIFIED_PASSWORD } from './test-credentials';

const BCRYPT_ROUNDS = 10;

async function run(query: string, params: unknown[]): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(query, params);
  } finally {
    await client.end();
  }
}

/** Creates the approved account for the apartment's email and assigns it. */
export async function createAccountForApartment(
  apartmentId: string
): Promise<void> {
  const passwordHash = await bcrypt.hash(UNVERIFIED_PASSWORD, BCRYPT_ROUNDS);
  await run(loadSql('insert-approved-user-for-apartment.sql'), [
    apartmentId,
    passwordHash,
  ]);
}

/** Assigns the apartment to the existing user with that email. */
export async function assignApartmentToUser(
  apartmentId: string,
  email: string
): Promise<void> {
  await run(loadSql('assign-apartment-to-user-by-email.sql'), [
    apartmentId,
    email,
  ]);
}
