# Development

Setup is in [Getting started](getting-started.md). This page is about working
in the codebase day to day.

## Commands

| Command                     | What it does                                                         |
| --------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                  | Dev server with hot reload. `pnpm dev:pretty` formats the JSON logs. |
| `pnpm build` / `pnpm start` | Production build, and serve it.                                      |
| `pnpm lint` / `lint:fix`    | ESLint, including the project's own rules.                           |
| `pnpm format`               | Prettier over the repository.                                        |
| `pnpm exec tsc --noEmit`    | Type check.                                                          |
| `pnpm test`                 | Unit and component tests (Vitest, watch mode).                       |
| `pnpm test:coverage`        | Same, once, with the coverage thresholds.                            |
| `pnpm test:e2e*`            | Browser tests. See [Testing](testing.md).                            |
| `pnpm test:perf`            | k6 load test. Seed first with `perf/seed/seed-perf-data.ts`.         |
| `pnpm db:migrate`           | Create and apply a migration (development).                          |
| `pnpm db:deploy`            | Apply pending migrations (production, CI).                           |
| `pnpm db:generate`          | Regenerate the Prisma client in `src/generated`.                     |

## Before you push

A pre-commit hook runs `lint-staged`, the unit tests and `tsc`, and blocks the
commit if any fail. CI runs lint, type check, unit tests with coverage, the
browser suites and a security scan. Running these first saves a round trip:

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm test --run
```

Commit messages follow Conventional Commits (`feat(import): ...`,
`fix(auth): ...`, `docs: ...`).

## Changing the database

1. Edit `prisma/schema.prisma`.
2. Run `pnpm db:migrate` and name the migration. This writes SQL to
   `prisma/migrations/` and applies it to your database.
3. Commit the schema change and the migration folder together.

Never edit a migration that has been applied anywhere; add a new one. A
migration that drops or tightens a column must keep existing data: add the
column as nullable, backfill, then tighten. Raw SQL belongs in migration files
and nowhere else in the code.

Migrations are applied in production with `pnpm db:deploy` or by the
`ekartoteka-migrations` service, see [Deployment](deployment.md).

## Adding a page, action or route

- **Page** - add it under `src/app/`. Resolve the session with `getSession()`
  inside a `Suspense` section and redirect anonymous users to `/login`. Admin
  pages live under `src/app/admin/`, whose layout checks the role in the
  database.
- **Mutation from the browser** - a Server Action in `src/actions/<feature>/`,
  and the database work in `src/lib/mutations/`. Start with
  `requireUserAction()` or `requireAdminAction()`. The lint rule fails the
  build otherwise.
- **API route** - only when a Server Action does not fit, e.g. a read used by
  SWR, or the import. Start with `requireUser()` or `requireAdmin()` and return
  its `response`.
- **Read from a client component** - use SWR with the shared options and
  `fetchJson` from `src/lib/swr`. Do not write `useEffect` fetches.

Whatever you add, derive the user from the session and scope queries to the
caller's own apartments. [Code conventions](code-conventions.md) has the full
list of rules.

## Specifications

`openspec/` describes what the app does, one capability per folder, in
`GIVEN / WHEN / THEN` scenarios. When behaviour, an API, the data model or a
convention changes, update the matching `openspec/specs/<capability>/spec.md`
in the same pull request. For a large change, use the OpenSpec workflow instead
(`openspec/changes/<name>/` with a proposal, design, tasks and spec deltas, then
archive it). CI fails while an unarchived change is left in
`openspec/changes/`.

These files are written for coding agents as much as for people. This
documentation is for people; keep the two consistent, but do not copy one into
the other.

## Releasing

The `Release version` workflow (run manually on `main`, choosing major, minor
or patch) bumps the version in `package.json` and prepends the commit subjects
since the last tag to `CHANGELOG.md`, so commit messages end up there as
written. Pushes to `main` and version tags build the Docker image, run all the
checks against it and, if they pass, publish it to `ghcr.io`.
