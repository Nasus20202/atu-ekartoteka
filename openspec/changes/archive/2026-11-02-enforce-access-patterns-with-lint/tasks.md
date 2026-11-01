# Tasks

## 1. Rules

- [x] 1.1 Add `eslint-rules/prefer-access-helpers.mjs` reporting `APPROVED`/`ADMIN` comparisons on member expressions and bare `status`/`role` variables; verify `eslint-rules/__tests__/rules.test.mjs` covers valid and invalid cases including optional chaining
- [x] 1.2 Add `eslint-rules/no-raw-sql.mjs` reporting the five raw-SQL members; verify the same test file covers each one and accepts the query API
- [x] 1.3 Register both rules in `eslint.config.mjs` with the predicate modules ignored, and allow relative imports in `eslint-rules/**`; verify `pnpm lint` passes on the repository

## 2. Call sites

- [x] 2.1 Replace direct `APPROVED`/`ADMIN` comparisons with `isApprovedStatus`, `isApprovedAccount`, `isAdminRole` and `isApprovedAdmin` across pages, API routes, layouts and mutations; verify `pnpm lint` reports no `local/prefer-access-helpers`
- [x] 2.2 Mock `isAdminRole` next to `hasAdminAccess` in the admin route tests; verify `pnpm test` passes
- [x] 2.3 Replace `prisma.$queryRaw` in the health check with `prisma.user.count()`; verify `pnpm lint` reports no `local/no-raw-sql` and the health tests pass

## 3. Integration

- [x] 3.1 Run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test`; verify all pass and no changed file exceeds 200 lines

## Workflow follow-up

- Archive the change after review so the code-style spec picks up the deltas.
