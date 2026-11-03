/**
 * Global setup for E2E tests.
 * Runs once before all tests to prepare the functional and visual databases.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { cleanTestData } from './utils/clean-test-data';
import { getVisualDatabaseUrl } from './utils/database-urls';
import { ensureDatabase } from './utils/ensure-database';
import { seedTestData } from './utils/seed-test-data';
import { seedVisualTestData } from './utils/seed-visual-test-data';

// Load environment variables
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set, cannot run E2E tests');
  }

  const visualDatabaseUrl = getVisualDatabaseUrl(databaseUrl);

  console.log('🛠️ Preparing databases...');
  await ensureDatabase(databaseUrl);
  await ensureDatabase(visualDatabaseUrl);

  console.log('🧹 Cleaning databases...');
  await cleanTestData(databaseUrl);
  await cleanTestData(visualDatabaseUrl);

  console.log('🌱 Seeding test data...');
  await seedTestData(databaseUrl);
  await seedVisualTestData(visualDatabaseUrl);

  console.log('✅ Databases ready for E2E tests');
}

export default globalSetup;
