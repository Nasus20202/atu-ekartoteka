/**
 * Clean E2E test data from the database.
 *
 * Cleans up E2E test data by:
 * 1. Deleting users with @e2e-test.com email pattern
 * 2. Deleting HOAs with TEST01 external ID
 * 3. Cascading deletes for related records
 */

import * as fs from 'fs';
import * as path from 'path';
import * as pg from 'pg';

const SQL_DIR = path.join(__dirname, '../test-data/seed');

function loadSql(filename: string): string {
  // Prevent path traversal: only allow bare filenames (no path separators)
  if (path.basename(filename) !== filename) {
    throw new Error('Invalid SQL filename');
  }
  const candidate = path.resolve(path.join(SQL_DIR, filename));
  const resolvedBase = path.resolve(SQL_DIR) + path.sep;
  if (!candidate.startsWith(resolvedBase)) {
    throw new Error('Invalid SQL filename');
  }
  return fs.readFileSync(candidate, 'utf-8');
}

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
      await client.query(
        `DELETE FROM "EmailVerification" WHERE "userId" = ANY($1)`,
        [testUserIds]
      );
      await client.query(
        `DELETE FROM "PasswordReset" WHERE "userId" = ANY($1)`,
        [testUserIds]
      );
      await client.query(
        `UPDATE "Apartment" SET "userId" = NULL WHERE "userId" = ANY($1)`,
        [testUserIds]
      );
      await client.query(`DELETE FROM "User" WHERE id = ANY($1)`, [
        testUserIds,
      ]);
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
        await client.query(
          `DELETE FROM "Charge" WHERE "apartmentId" = ANY($1)`,
          [testApartmentIds]
        );
        await client.query(
          `DELETE FROM "ChargeNotification" WHERE "apartmentId" = ANY($1)`,
          [testApartmentIds]
        );
        await client.query(
          `DELETE FROM "Payment" WHERE "apartmentId" = ANY($1)`,
          [testApartmentIds]
        );
        console.log(
          `  - Deleted charges/payments for ${testApartmentIds.length} test apartments`
        );

        // Delete test apartments
        await client.query(`DELETE FROM "Apartment" WHERE id = ANY($1)`, [
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
if (require.main === module) {
  cleanTestData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
