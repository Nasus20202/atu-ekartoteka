# Tasks

## 1. Data Model

- [x] 1.1 Add the Prisma models, enums and a migration; verify `pnpm exec prisma validate` and applying the migration to a database
- [x] 1.2 Add `src/lib/voting/types`, `dto` and `rules` (statuses, transitions, answers, token hashing, constants) with unit tests

## 2. Server Logic

- [x] 2.1 Add queries and mutations; verify through use case tests with mocks
- [x] 2.2 Add admin use cases (create, update, delete, change status, notify) with tests
- [x] 2.3 Add tenant use cases (request confirmation, confirm vote) with tests
- [x] 2.4 Add the two emails, email types and service methods with tests
- [x] 2.5 Add Server Actions in `src/actions/voting/` with guard tests

## 3. Admin UI

- [x] 3.1 List, create, edit and detail pages with results, voter list, status controls and the notify dialog

## 4. Tenant UI

- [x] 4.1 List, ballot and results pages; navbar link with bell badge; dashboard card

## 5. Quality

- [x] 5.1 Component and page tests, E2E flow, spec index, `docs/`, `pnpm lint`, `tsc`, `prettier`, `CI=1 pnpm test`

## Workflow follow-up

- Add `openspec/specs/voting/spec.md` to the spec index in `openspec/config.yaml` after archiving.
