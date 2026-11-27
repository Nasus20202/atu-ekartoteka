/**
 * Seed an approved tenant that owns apartments in the test HOA, for voting specs.
 * Every call uses a unique email and apartment ids, so specs never share a voter.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import { E2E_PASSWORD } from './test-credentials';

const HOA_EXTERNAL_ID = 'TEST01';
const BCRYPT_ROUNDS = 10;

export interface VotingTenant {
  email: string;
  password: string;
  name: string;
}

export async function createVotingTenant(
  apartmentCount = 1
): Promise<VotingTenant> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();

    const hoa = await client.query(
      loadSql('select-hoa-id-by-external-id.sql'),
      [HOA_EXTERNAL_ID]
    );
    const hoaId = hoa.rows[0]?.id;
    if (!hoaId) throw new Error('Test HOA not found, run global seed first');

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const email = `voter-e2e-${suffix}@e2e-test.com`;
    const name = `E2E Voter ${suffix}`;

    await client.query(loadSql('insert-tenant-user.sql'), [
      email,
      await bcrypt.hash(E2E_PASSWORD, BCRYPT_ROUNDS),
      name,
    ]);

    for (let index = 0; index < apartmentCount; index++) {
      const apartment = await client.query(
        loadSql('insert-unassigned-apartment.sql'),
        [
          `WV-${suffix}-${index}`,
          `TEST01-VOTE-${suffix}-${index}`,
          name,
          email,
          `V${index + 1}`,
          true,
          hoaId,
        ]
      );
      await client.query(loadSql('assign-apartment-to-user-by-email.sql'), [
        apartment.rows[0].id,
        email,
      ]);
    }

    return { email, password: E2E_PASSWORD, name };
  } finally {
    await client.end();
  }
}
