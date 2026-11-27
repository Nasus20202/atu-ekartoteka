/**
 * A temporary resident with an apartment that has charges and payments, whose
 * data nobody else may read.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import { E2E_PASSWORD } from './test-credentials';

const BCRYPT_ROUNDS = 10;
// Printed on no seeded record, so seeing it means this apartment leaked
const CHARGE_AMOUNT = 913.37;

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

export function createNeighbourApartment() {
  return withClient(async (client) => {
    // Unique, because every worker and retry seeds its own resident
    const externalId = `TESTNB${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const email = `${externalId.toLowerCase()}@e2e-test.com`;
    const number = externalId.slice(4);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const hoa = await client.query(loadSql('upsert-test-hoa.sql'), [
      externalId,
    ]);
    const hoaId = hoa.rows[0].id as string;
    const apartment = await client.query(
      loadSql('insert-unassigned-apartment.sql'),
      ['W00001', `${externalId}-1`, 'Sąsiad Testowy', '', number, true, hoaId]
    );
    const apartmentId = apartment.rows[0].id as string;
    const user = await client.query(loadSql('insert-tenant-user.sql'), [
      email,
      await bcrypt.hash(E2E_PASSWORD, BCRYPT_ROUNDS),
      'E2E Neighbour',
    ]);
    await client.query(loadSql('assign-apartment-to-user-by-email.sql'), [
      apartmentId,
      email,
    ]);
    await client.query(loadSql('insert-charge-line.sql'), [
      apartmentId,
      new Date(Date.UTC(year, now.getMonth(), 1)),
      new Date(Date.UTC(year, now.getMonth() + 1, 0)),
      `${year}${month}`,
      1,
      CHARGE_AMOUNT,
    ]);
    await client.query(loadSql('insert-payment.sql'), [
      `${apartmentId}-${year}`,
      apartmentId,
      year,
      new Date(Date.UTC(year, 0, 1)),
      new Date(Date.UTC(year, 11, 31)),
    ]);

    return {
      email,
      hoaId,
      userId: user.rows[0].id as string,
      apartmentId,
      address: `ul. Testowa 1/${number}`,
      chargeAmount: '913,37 zł',
      year,
      monthParam: `${year}-${month}`,
    };
  });
}

export type NeighbourApartment = Awaited<
  ReturnType<typeof createNeighbourApartment>
>;

export function deleteNeighbourApartment(neighbour: NeighbourApartment) {
  const apartmentIds = [neighbour.apartmentId];
  return withClient(async (client) => {
    await client.query(loadSql('delete-charges-by-apartments.sql'), [
      apartmentIds,
    ]);
    await client.query(loadSql('delete-payments-by-apartments.sql'), [
      apartmentIds,
    ]);
    await client.query(loadSql('cleanup-hoa-apartments.sql'), [
      neighbour.hoaId,
    ]);
    await client.query(loadSql('cleanup-hoa.sql'), [neighbour.hoaId]);
    await client.query(loadSql('delete-users-by-ids.sql'), [
      [neighbour.userId],
    ]);
  });
}
