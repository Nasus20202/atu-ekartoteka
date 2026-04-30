/**
 * Global teardown for E2E tests.
 * Runs once after all tests to clean up the database.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { cleanTestData } from './utils/clean-test-data';

// Load environment variables
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

async function globalTeardown() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping cleanup');
    return;
  }

  console.log('🧹 Cleaning up test data...');
  await cleanTestData(databaseUrl);

  console.log('✅ Cleanup complete');
}

export default globalTeardown;
