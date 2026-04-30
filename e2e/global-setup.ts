/**
 * Global setup for E2E tests.
 * Runs once before all tests to prepare the database.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { cleanTestData } from './utils/clean-test-data';
import { seedTestData } from './utils/seed-test-data';

// Load environment variables
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set, cannot run E2E tests');
  }

  console.log('🧹 Cleaning database...');
  await cleanTestData(databaseUrl);

  console.log('🌱 Seeding test data...');
  await seedTestData(databaseUrl);

  console.log('✅ Database ready for E2E tests');
}

export default globalSetup;
