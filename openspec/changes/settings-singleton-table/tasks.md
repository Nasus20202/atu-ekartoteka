# Tasks

## 1. Schema and migration

- [ ] 1.1 Replace `AppSetting` with `AppSettings` in `prisma/schema.prisma` (`id Int @id @default(1)`, `tenantHistoryYearsBack Int @default(2)`, `updatedAt`) and run `pnpm db:generate`; verify the client types compile
- [ ] 1.2 Write the migration: create the table, add `CHECK (id = 1)` and `CHECK (tenantHistoryYearsBack BETWEEN 0 AND 20)`, insert row 1 from the old table with the guarded `INSERT ... SELECT`, drop `AppSetting`; verify with `pnpm db:deploy` on a database with an empty old table
- [ ] 1.3 Verify the migration on a database that already has the setting: run it against old rows with value 5, a missing row, `"abc"`, `2.5`, `-1` and `99`; verify the result is 5, 2, 2, 2, 2, 2 and always exactly one row
- [ ] 1.4 Add a test that reads the migration SQL and asserts its bounds equal `MIN_`/`MAX_`/`DEFAULT_TENANT_HISTORY_YEARS_BACK`; verify it passes and fails when a constant changes
- [ ] 1.5 Verify the constraints: inserting a second row and writing 21 or -1 are rejected by the database (check with a real database run)

## 2. Cached single-row access

- [ ] 2.1 Rewrite `get-app-settings.ts` as `readAppSettings` (`findUnique({ where: { id: 1 } })`, defaults when absent) wrapped as `getAppSettings = cache(...)`; add `__tests__` for stored row, missing row and one query for repeated calls in the same render
- [ ] 2.2 Rewrite `update-app-settings.ts` as a single `upsert` on `id: 1` that returns the written values without using the cached reader, skips the write when nothing changed, and keeps the `Partial` input; update its tests (create, update, no-op, returns fresh values)
- [ ] 2.3 Remove `resolveAppSettings` from `registry.ts` and update `registry.test.ts`; verify unknown keys, non-objects, empty objects and out-of-range values are still rejected by `parseAppSettingsUpdate`
- [ ] 2.4 Verify consumers are unchanged: `pnpm test` for `settings-section`, `updateSettingsAction` and `getTenantHistoryStartYear`

## 3. Specs and end-to-end

- [ ] 3.1 Run `openspec validate settings-singleton-table`; fix any findings
- [ ] 3.2 Run the settings E2E flow (admin saves 1, tenant window changes, reset to default) against the migrated database; verify it passes and that `pnpm lint` and `pnpm exec prettier --check` are clean
- [ ] 3.3 Commit as one `feat`/`refactor` commit: `refactor(settings): store app settings in one validated row`

## Workflow follow-up

- Archive this change with `openspec-archive-change` after review so the main `tenant-history-window` spec is updated.
