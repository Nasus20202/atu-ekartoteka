/**
 * Global teardown for E2E tests.
 * Runs once after all tests to clean up the database.
 */

import dotenv from 'dotenv';
import * as path from 'path';

import { cleanTestData } from './utils/clean-test-data';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
