/** A tenant account of an apartment that settlements are imported for. */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import type { ImportApartment, ImportHoa } from './settlement-import-hoa';
import { E2E_PASSWORD } from './test-credentials';

const BCRYPT_ROUNDS = 10;

export interface ImportTenant {
  userId: string;
  email: string;
}

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

export function createImportTenant(
  { externalId }: ImportHoa,
  { id }: ImportApartment
): Promise<ImportTenant> {
  const email = `${externalId.toLowerCase()}@e2e-test.com`;
  return withClient(async (client) => {
    const user = await client.query(loadSql('insert-tenant-user.sql'), [
      email,
      await bcrypt.hash(E2E_PASSWORD, BCRYPT_ROUNDS),
      'E2E Import Tenant',
    ]);
    await client.query(loadSql('assign-apartment-to-user-by-email.sql'), [
      id,
      email,
    ]);
    return { userId: user.rows[0].id as string, email };
  });
}

export function deleteImportTenant({ userId }: ImportTenant): Promise<void> {
  return withClient(async (client) => {
    await client.query(loadSql('unassign-apartments-from-users.sql'), [
      [userId],
    ]);
    await client.query(loadSql('delete-users-by-ids.sql'), [[userId]]);
  });
}
