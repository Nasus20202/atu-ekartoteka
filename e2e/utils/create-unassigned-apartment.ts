/**
 * Seed an unassigned apartment for bulk-create E2E tests.
 *
 * Creates (or resets) a second apartment in the test HOA with no user
 * assigned, so the bulk-create page always has something to show.
 * Returns the apartment id.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';

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
    loadSql('select-user-id-by-email.sql'),
    [UNASSIGNED_EMAIL]
  );
  const userId = result.rows[0]?.id;

  if (!userId) return;

  const userIds = [userId];
  await client.query(loadSql('unassign-apartments-from-users.sql'), [userIds]);
  await client.query(loadSql('delete-email-verifications-by-users.sql'), [
    userIds,
  ]);
  await client.query(loadSql('delete-password-resets-by-users.sql'), [userIds]);
  await client.query(loadSql('delete-users-by-ids.sql'), [userIds]);
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
      loadSql('select-hoa-id-by-external-id.sql'),
      ['TEST01']
    );
    const hoaId = hoaResult.rows[0]?.id;

    if (!hoaId) {
      throw new Error('Test HOA (TEST01) not found — run global seed first');
    }

    await removeInvitedAccount(client);

    const result = await client.query(
      loadSql('insert-unassigned-apartment.sql'),
      [
        UNASSIGNED_EXTERNAL_OWNER_ID,
        UNASSIGNED_EXTERNAL_APARTMENT_ID,
        'E2E Unassigned Owner',
        UNASSIGNED_EMAIL,
        '2B',
        true,
        hoaId,
      ]
    );

    return result.rows[0].id as string;
  } finally {
    await client.end();
  }
}
