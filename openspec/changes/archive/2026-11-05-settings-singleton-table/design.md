# Design

## Context

`AppSetting { key @id, value Json, updatedAt }` is read by `getAppSettings` (`findMany` then `resolveAppSettings`) and written by `updateAppSettings` (one `upsert` per changed key). The registry in `src/lib/settings/registry.ts` holds each setting's default and parser. Rules in `AGENTS.md` apply: Prisma query API only (raw SQL only in migration files), files under 200 lines, no magic numbers (`src/lib/settings/constants.ts` already holds the default, minimum and maximum). Several loaders (`getTenantHistoryStartYear` in the dashboard, charges and payments loaders) call `getAppSettings` in one request. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- One row, typed columns, constraints enforced by Postgres.
- A migration that is correct for an empty or populated old table.
- One settings query per request.

**Non-Goals:**

- Cross-request caching, new settings, or UI changes.

## Decisions

**Singleton row with a fixed key.** `model AppSettings { id Int @id @default(1), tenantHistoryYearsBack Int @default(2), updatedAt DateTime @updatedAt }` plus `CHECK ("id" = 1)` and `CHECK ("tenantHistoryYearsBack" BETWEEN 0 AND 20)` added in the migration (Prisma does not track `CHECK`s, like the existing `shareRatio` and collation notes). The primary key already prevents duplicates; the `id = 1` check makes "only one row" a database guarantee instead of a convention. Alternative: keep the key/value table and add a `CHECK` on `key`; rejected because values stay untyped JSON.

**Each new setting is a column and a migration.** The old registry comment promised no migration per setting. That is traded for type safety and range checks in the database. The bounds appear in the migration and in `constants.ts`; a unit test reads the migration SQL and asserts the numbers match the constants, so they cannot drift.

**Migration order.** In one migration: create `AppSettings`; add the `CHECK`s; insert row `1` from the old table; drop `AppSetting`. The insert is a single `INSERT ... SELECT` that always produces one row:

```sql
INSERT INTO
  "AppSettings" ("id", "tenantHistoryYearsBack", "updatedAt")
SELECT
  1,
  COALESCE(
    (
      SELECT
        "years"
      FROM
        (
          SELECT
            CASE
              WHEN jsonb_typeof("value") = 'number'
              AND ("value" #>> '{}') ~ '^[0-9]{1,2}$' THEN ("value" #>> '{}')::int
            END AS "years"
          FROM
            "AppSetting"
          WHERE
            "key" = 'tenantHistoryYearsBack'
        ) AS "stored"
      WHERE
        "years" BETWEEN 0 AND 20
    ),
    2
  ),
  CURRENT_TIMESTAMP;
```

The cast only happens inside the `CASE` branch that already matched the digit regex (Postgres does not order `AND` operands, so the guard cannot live in a `WHERE`), and the range is checked on the derived column. A missing row, a non-number, a decimal, a negative number or a value from 21 to 99 yields no row, so `COALESCE` falls back to `2`. Rollback: the dropped table held at most one meaningful value; a down path is not provided, matching the existing migrations, and the pre-deploy database backup remains the rollback.

**Reads and writes.** `readAppSettings()` does `findUnique({ where: { id: 1 } })` and falls back to defaults when the row is absent (for example a freshly truncated e2e database). `updateAppSettings` validates with the registry, then `upsert({ where: { id: 1 }, create, update })` for only the supplied fields, and returns the stored values from the upsert result. The update returns the written row directly, so it never reads through the request cache.

**Once per request.** `getAppSettings = cache(readAppSettings)` using React `cache`, the pattern already used by `getSession` and the dashboard loaders. It is request-scoped, so the next request re-reads. The mutation does not call the cached reader. Alternative: Next `unstable_cache` or `'use cache'` with tags; rejected because the requirement is per-request and cross-request caching needs invalidation across replicas.

**Registry stays, simplified.** The registry keeps one entry per setting (default and parser) for Server Action validation and typing; `resolveAppSettings` (merge stored over defaults) is deleted because columns are never missing.

## Risks / Trade-offs

- [Bounds duplicated in SQL and TypeScript] → a test asserts the migration's numbers equal the constants.
- [A new setting now needs a migration] → accepted; the migration is a one-line `ADD COLUMN` with `DEFAULT` and `CHECK`.
- [Cached value stale inside the request that saved it] → `updateAppSettings` returns the written row and does not use the cached reader.
- [Cast error in the migration on malformed JSON] → guarded by `jsonb_typeof`, a digit regex and `CASE`; covered by running the migration against empty, valid, decimal, negative, string and out-of-range rows.
