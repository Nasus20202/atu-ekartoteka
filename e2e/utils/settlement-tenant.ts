/**
 * A temporary tenant with one apartment that has settlements, next to an
 * apartment of someone else that has them too.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { deleteSettlements } from './delete-settlements';
import { loadSql } from './load-sql';
import { seedSettlements } from './seed-settlements';
import { E2E_PASSWORD } from './test-credentials';

const BCRYPT_ROUNDS = 10;
// Far enough back to stay outside any history window an admin might set
const HIDDEN_YEARS_AGO = 30;

async function withClient<T>(work: (client: pg.Client) => Promise<T>) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

export function createSettlementTenant() {
  return withClient(async (client) => {
    // Unique, because every worker that runs the tests seeds its own tenant
    const externalId = `TESTSET${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const year = new Date().getFullYear();
    const hiddenYear = year - HIDDEN_YEARS_AGO;
    const email = `${externalId.toLowerCase()}@e2e-test.com`;
    const hoa = await client.query(loadSql('upsert-test-hoa.sql'), [
      externalId,
    ]);
    const hoaId = hoa.rows[0].id as string;
    const apartment = async (index: number) => {
      const result = await client.query(
        loadSql('insert-unassigned-apartment.sql'),
        [
          `W0000${index}`,
          `${externalId}-${externalId}-00000-0000${index}M`,
          `Lokator ${index}`,
          '',
          `${index}`,
          true,
          hoaId,
        ]
      );
      return result.rows[0].id as string;
    };
    const ownId = await apartment(1);
    const foreignId = await apartment(2);
    const user = await client.query(loadSql('insert-tenant-user.sql'), [
      email,
      await bcrypt.hash(E2E_PASSWORD, BCRYPT_ROUNDS),
      'E2E Settlement Tenant',
    ]);
    await client.query(loadSql('assign-apartment-to-user-by-email.sql'), [
      ownId,
      email,
    ]);
    const own = await seedSettlements(client, ownId, {
      utility: [year, year - 1, hiddenYear],
      annual: [year - 1],
    });
    const foreign = await seedSettlements(client, foreignId, {
      utility: [year],
      annual: [],
    });

    return {
      email,
      year,
      hiddenYear,
      hoaId,
      userId: user.rows[0].id as string,
      ownId,
      foreignId,
      // Ordered as seeded: this year, last year, the hidden one
      ownUtilityIds: own.utilityIds,
      foreignUtilityId: foreign.utilityIds[0],
    };
  });
}

export type SettlementTenant = Awaited<
  ReturnType<typeof createSettlementTenant>
>;

/** Gives the tenant the other apartment as well. */
export function assignSecondApartment(tenant: SettlementTenant) {
  return withClient(async (client) => {
    await client.query(loadSql('assign-apartment-to-user-by-email.sql'), [
      tenant.foreignId,
      tenant.email,
    ]);
  });
}

export function deleteSettlementTenant(tenant: SettlementTenant) {
  return withClient(async (client) => {
    await deleteSettlements(client, [tenant.ownId, tenant.foreignId]);
    await client.query(loadSql('cleanup-hoa-apartments.sql'), [tenant.hoaId]);
    await client.query(loadSql('cleanup-hoa.sql'), [tenant.hoaId]);
    await client.query(loadSql('delete-users-by-ids.sql'), [[tenant.userId]]);
  });
}
