# Proposal

## Why

The session work proved the point twice: a direct `role === UserRole.ADMIN` in an API route bypassed the database check, and four `status !== AccountStatus.APPROVED` comparisons had to be found by hand. The codebase also declares "no raw SQL" as a rule, but the only enforcement was review — a health check still used `$queryRaw`, and nothing stopped the next one.

## What Changes

- Two local ESLint rules in `eslint-rules/`:
  - `local/prefer-access-helpers` reports `status === AccountStatus.APPROVED`, `role === UserRole.ADMIN` and their negations/loose variants, on member expressions and on bare `status` / `role` variables. The two predicate modules are the only allowed place for the comparison.
  - `local/no-raw-sql` reports `$queryRaw`, `$queryRawUnsafe`, `$queryRawTyped`, `$executeRaw` and `$executeRawUnsafe` anywhere under `src/`.
- The remaining direct comparisons are routed through `isApprovedStatus`, `isApprovedAccount`, `isAdminRole` and `isApprovedAdmin`.
- The database health check uses `prisma.user.count()` instead of `SELECT 1`.
- Both rules are covered by `eslint-rules/__tests__/rules.test.mjs` through `RuleTester`.

### Non-goals

- No rule for switches over `status`; presentation switches that map every status to a label or badge stay direct.
- No autofix: the correct replacement depends on the call site.
- No new dependency; the rules are plain local modules.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `code-style`: access decisions must use the shared predicates, and Prisma raw SQL is forbidden outside migrations, both enforced by ESLint.

## Impact

`eslint.config.mjs`, new `eslint-rules/` modules and tests, and the call sites in `src/app/page.tsx`, `src/app/api/admin/users/**`, `src/app/admin/users/status-change-panel.tsx`, `src/components/account/user-status-section.tsx`, `src/lib/auth/**`, `src/lib/metadata/page-titles.ts`, `src/lib/mutations/users/update-user-status.ts` and `src/lib/database/health-check.ts`.
