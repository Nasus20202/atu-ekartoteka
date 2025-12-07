/**
 * Seed E2E test data into the database.
 *
 * Creates test users, HOA, apartment, and charges for E2E tests.
 * Cleanup is done by clean-test-data.ts using email/ID patterns.
 */

import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as pg from 'pg';

import {
  ADMIN_EMAIL,
  ADMIN_NAME,
  ADMIN_PASSWORD,
  USER_EMAIL,
  USER_NAME,
  USER_PASSWORD,
} from './test-credentials';

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

export async function seedTestData(connectionString?: string) {
  const dbUrl = connectionString || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const userPasswordHash = await bcrypt.hash(USER_PASSWORD, 10);

    // Create admin user
    const adminResult = await client.query(loadSql('upsert-admin-user.sql'), [
      ADMIN_EMAIL,
      adminPasswordHash,
      ADMIN_NAME,
    ]);
    console.log('  - Created/updated admin user:', adminResult.rows[0]?.id);

    // Create regular user (approved with apartment)
    const userResult = await client.query(loadSql('upsert-regular-user.sql'), [
      USER_EMAIL,
      userPasswordHash,
      USER_NAME,
    ]);
    const userId = userResult.rows[0]?.id;
    console.log('  - Created/updated regular user:', userId);

    // Create HOA
    const hoaResult = await client.query(loadSql('upsert-hoa.sql'));
    const hoaId = hoaResult.rows[0]?.id;
    console.log('  - Created/updated HOA:', hoaId);

    // Create apartment and assign to user
    const aptResult = await client.query(loadSql('upsert-apartment.sql'), [
      USER_NAME,
      USER_EMAIL,
      hoaId,
      userId,
    ]);
    console.log('  - Created/updated apartment:', aptResult.rows[0]?.id);

    // Create some charges for the apartment
    const apartmentId = aptResult.rows[0]?.id;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const period = `${currentYear}${String(currentMonth).padStart(2, '0')}`;

    await client.query(loadSql('insert-charges.sql'), [
      apartmentId,
      new Date(currentYear, currentMonth - 1, 1),
      new Date(currentYear, currentMonth, 0),
      period,
    ]);
    console.log('  - Created charges for current period:', period);

    // Create charge notifications (monthly breakdown)
    await client.query(loadSql('insert-charge-notifications.sql'), [
      apartmentId,
    ]);
    console.log('  - Created charge notifications');

    // Create payments record for current year
    await client.query(loadSql('insert-payment.sql'), [
      `${apartmentId}-${currentYear}`,
      apartmentId,
      currentYear,
      new Date(currentYear, 0, 1),
      new Date(currentYear, 11, 31),
    ]);
    console.log('  - Created payments for year:', currentYear);
  } finally {
    await client.end();
  }
}

// Allow running directly: pnpm exec tsx e2e/utils/seed-test-data.ts
if (require.main === module) {
  seedTestData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
