/**
 * Seed a production-sized dataset for the k6 load test.
 *
 * Tenants (perf-user-N) own evenly spaced apartments across all HOAs, so every
 * virtual user reads a different user's rows. Ids are deterministic, which lets
 * the k6 scenarios pick targets without a lookup.
 */

import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as pg from 'pg';
import { fileURLToPath } from 'url';

import { seedCharges } from './seed-charges';

const SQL_DIR = fileURLToPath(new URL('./sql', import.meta.url));
const BCRYPT_COST = 10;
// Must match TENANT_PASSWORD in perf/lib/config.ts
const PERF_PASSWORD = 'PerfPassword123!';

const HOAS = Number(process.env.PERF_SEED_HOAS || 100);
const APARTMENTS_PER_HOA = Number(process.env.PERF_SEED_APARTMENTS || 100);
const TENANTS = Number(process.env.PERF_SEED_TENANTS || 1000);
const CHARGE_MONTHS = Number(process.env.PERF_SEED_CHARGE_MONTHS || 40);
const CHARGE_LINES_PER_MONTH = Number(process.env.PERF_SEED_CHARGE_LINES || 5);
const NOTIFICATION_LINES = Number(process.env.PERF_SEED_NOTIFICATIONS || 3);
const PAYMENT_YEARS = Number(process.env.PERF_SEED_PAYMENT_YEARS || 6);
// Must match TENANT_HISTORY_YEARS_BACK in perf/lib/config.ts
const TENANT_HISTORY_YEARS_BACK = Number(
  process.env.PERF_SEED_TENANT_HISTORY_YEARS_BACK || 5
);

const sql = (name: string) =>
  fs.readFileSync(path.join(SQL_DIR, `${name}.sql`), 'utf-8');

export async function seedPerfData(connectionString?: string) {
  const dbUrl = connectionString || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL environment variable is not set');

  const apartments = HOAS * APARTMENTS_PER_HOA;
  const passwordHash = await bcrypt.hash(PERF_PASSWORD, BCRYPT_COST);
  const steps: [string, unknown[]][] = [
    ['hoas', [HOAS]],
    ['users', [TENANTS, passwordHash]],
    ['apartments', [HOAS, APARTMENTS_PER_HOA, TENANTS]],
    ['notifications', [apartments, NOTIFICATION_LINES]],
    ['payments', [apartments, PAYMENT_YEARS]],
    ['app-settings', [TENANT_HISTORY_YEARS_BACK]],
  ];

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    for (const [name, params] of steps) {
      const started = Date.now();
      const result = await client.query(sql(name), params);
      console.log(
        `  - ${name}: ${result.rowCount} rows in ${Date.now() - started} ms`
      );
    }
    const chargesStarted = Date.now();
    const rows = await seedCharges(dbUrl, sql('charges'), {
      apartments,
      months: CHARGE_MONTHS,
      linesPerMonth: CHARGE_LINES_PER_MONTH,
    });
    console.log(
      `  - charges: ${rows} rows in ${Date.now() - chargesStarted} ms`
    );
    await client.query('ANALYZE');
  } finally {
    await client.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedPerfData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
