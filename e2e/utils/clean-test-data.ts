/**
 * Clean E2E test data from the database.
 *
 * Cleans up E2E test data by:
 * 1. Deleting users with @e2e-test.com email pattern
 * 2. Deleting HOAs with TEST01 external ID
 * 3. Cascading deletes for related records
 */

import * as pg from 'pg';
import { fileURLToPath } from 'url';

import { loadSql } from './load-sql';

export async function cleanTestData(connectionString?: string) {
  const dbUrl = connectionString || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    // Find test users by email pattern
    const testUsers = await client.query(loadSql('select-test-users.sql'));
    const testUserIds = testUsers.rows.map((r) => r.id);

    if (testUserIds.length > 0) {
      // Delete related records for test users (run each statement separately)
      await client.query(loadSql('delete-email-verifications-by-users.sql'), [
        testUserIds,
      ]);
      await client.query(loadSql('delete-password-resets-by-users.sql'), [
        testUserIds,
      ]);
      await client.query(loadSql('unassign-apartments-from-users.sql'), [
        testUserIds,
      ]);
      await client.query(loadSql('delete-users-by-ids.sql'), [testUserIds]);
      console.log(`  - Deleted ${testUserIds.length} test users`);
    }

    // Find test HOAs by external ID pattern
    const testHoas = await client.query(loadSql('select-test-hoas.sql'));
    const testHoaIds = testHoas.rows.map((r) => r.id);

    if (testHoaIds.length > 0) {
      // Find apartments in test HOAs
      const testApartments = await client.query(
        loadSql('select-test-apartments.sql'),
        [testHoaIds]
      );
      const testApartmentIds = testApartments.rows.map((r) => r.id);

      if (testApartmentIds.length > 0) {
        // Delete charges/payments for test apartments (run each statement separately)
        await client.query(loadSql('delete-charges-by-apartments.sql'), [
          testApartmentIds,
        ]);
        await client.query(
          loadSql('delete-charge-notifications-by-apartments.sql'),
          [testApartmentIds]
        );
        await client.query(loadSql('delete-payments-by-apartments.sql'), [
          testApartmentIds,
        ]);
        console.log(
          `  - Deleted charges/payments for ${testApartmentIds.length} test apartments`
        );

        // Delete test apartments
        await client.query(loadSql('delete-apartments-by-ids.sql'), [
          testApartmentIds,
        ]);
        console.log(`  - Deleted ${testApartmentIds.length} test apartments`);
      }

      // Delete test HOAs
      await client.query(loadSql('cleanup-test-hoas.sql'), [testHoaIds]);
      console.log(`  - Deleted ${testHoaIds.length} test HOAs`);
    }
  } finally {
    await client.end();
  }
}

// Allow running directly: pnpm exec tsx e2e/utils/clean-test-data.ts
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanTestData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
