/**
 * Polish name ordering in the admin users table, backed by the database
 * collation (Ł sorts right after L, before M/Ż).
 */

import * as pg from 'pg';

import { expect, test } from '../fixtures';
import { openAllUsers, searchUsers } from '../utils/admin-users';

const NAMES = ['Żaneta Nowak', 'Adam Nowak', 'Łukasz Nowak'];
const EXPECTED_ORDER = ['Adam Nowak', 'Łukasz Nowak', 'Żaneta Nowak'];

function connect() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  return new pg.Client({ connectionString: dbUrl });
}

/** Creates rejected users with the same email prefix, newest first. */
async function createUsers(prefix: string) {
  const client = connect();
  try {
    await client.connect();
    for (const [index, name] of NAMES.entries()) {
      await client.query(
        `INSERT INTO "User" (id, email, name, role, status, "emailVerified", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'TENANT', 'REJECTED', true,
                 NOW() - $3 * INTERVAL '1 second', NOW())`,
        [`${prefix}-${index}@e2e-test.com`, name, index]
      );
    }
  } finally {
    await client.end();
  }
}

async function deleteUsers(prefix: string) {
  const client = connect();
  try {
    await client.connect();
    await client.query(`DELETE FROM "User" WHERE email LIKE $1`, [
      `${prefix}-%`,
    ]);
  } finally {
    await client.end();
  }
}

test.describe('Admin users table sorting', () => {
  const prefix = `user-name-sort-${Date.now()}`;

  test.beforeAll(async () => {
    await createUsers(prefix);
  });

  test.afterAll(async () => {
    await deleteUsers(prefix);
  });

  test('sorts Polish names with the database collation', async ({
    adminPage,
  }) => {
    await openAllUsers(adminPage);
    await searchUsers(adminPage, prefix);
    await adminPage.getByRole('button', { name: 'Tabela' }).click();

    const rows = adminPage.locator('tbody tr').filter({ hasText: prefix });
    await expect(rows).toHaveCount(NAMES.length);

    const sortedRequest = adminPage.waitForResponse(
      (response) =>
        response.url().includes('/api/admin/users') &&
        response.url().includes('sort=name') &&
        response.url().includes('order=asc') &&
        response.status() === 200
    );
    await adminPage.getByRole('button', { name: 'Użytkownik' }).click();
    await sortedRequest;

    await expect(rows.locator('td:first-child')).toHaveText(EXPECTED_ORDER);
  });
});
