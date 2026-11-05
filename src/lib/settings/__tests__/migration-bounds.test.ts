import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TENANT_HISTORY_YEARS_BACK,
  MAX_TENANT_HISTORY_YEARS_BACK,
  MIN_TENANT_HISTORY_YEARS_BACK,
} from '@/lib/settings/constants';

const MIGRATIONS_DIR = join(process.cwd(), 'prisma', 'migrations');
const MIGRATION_SUFFIX = 'app_settings_singleton';

function readMigration(): string {
  const folder = readdirSync(MIGRATIONS_DIR).find((name) =>
    name.endsWith(MIGRATION_SUFFIX)
  );
  if (!folder) throw new Error(`Missing ${MIGRATION_SUFFIX} migration`);

  return readFileSync(join(MIGRATIONS_DIR, folder, 'migration.sql'), 'utf8');
}

describe('app settings migration', () => {
  const sql = readMigration();

  it('checks the same range as the application', () => {
    const range = [
      ...sql.matchAll(/"tenantHistoryYearsBack" BETWEEN (\d+) AND (\d+)/g),
    ].map(([, min, max]) => [Number(min), Number(max)]);

    expect(range).toEqual([
      [MIN_TENANT_HISTORY_YEARS_BACK, MAX_TENANT_HISTORY_YEARS_BACK],
    ]);
  });

  it('applies the same range when carrying over the old value', () => {
    expect(sql).toContain(
      `"years" BETWEEN ${MIN_TENANT_HISTORY_YEARS_BACK} AND ${MAX_TENANT_HISTORY_YEARS_BACK}`
    );
  });

  it('uses the application default for the column and the fallback', () => {
    expect(sql).toContain(
      `"tenantHistoryYearsBack" INTEGER NOT NULL DEFAULT ${DEFAULT_TENANT_HISTORY_YEARS_BACK}`
    );
    expect(sql).toContain(`    ${DEFAULT_TENANT_HISTORY_YEARS_BACK}),`);
  });

  it('restricts the table to a single row', () => {
    expect(sql).toContain('CHECK ("id" = 1)');
  });
});
