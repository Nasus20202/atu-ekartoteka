# Design

## Context

Functional E2E and visual E2E both run against one Next.js app and one database (`e2e_test`). Global setup and teardown reseed that database, so functional specs that create or delete users change what the admin users list shows. Visual snapshots of admin lists are therefore not reproducible (see proposal.md - Why).

Playwright starts the app from `webServer`. The visual suite needs the same app as the functional suite, with a different `DATABASE_URL`. A dev server cannot run twice from one checkout, because Next holds a lock in `.next`, so both servers run one production build. This matches the Docker image, which runs the same build twice with different database URLs in compose. Visual tests also need Chromium 1248 (the version pinned by `@playwright/test` 1.64.1); the baselines in `e2e/visual/__screenshots__` were rendered with it, and a different build changes glyph antialiasing.

The users list in `src/components/users/users-list.tsx` renders cards in a `grid gap-4` with no column template. The grid therefore uses an implicit `auto` column. Its min-content width is the widest card's min-content width. `break-words` (`overflow-wrap: break-word`) does not reduce min-content, so an email without spaces makes the column as wide as the email. Measured at a 360 px viewport: the column grows to 631 px and `scrollWidth` becomes 647 px.

## Goals / Non-Goals

**Goals:**

- Functional E2E and visual E2E write to different databases, `e2e` and `e2e_visual`, and run on different servers, port 3000 and port 3001, from the same build.
- `pnpm test:e2e` and `pnpm test:e2e:visual` work from a fresh local checkout with only PostgreSQL running and a `.env` that sets `DATABASE_URL`.
- Every admin page has a visual test, and each admin visual test checks that the page does not scroll horizontally.
- The users list does not widen when a card has unbroken text.

**Non-Goals:**

- Changing the seeded functional data, the functional specs, or the admin page layouts beyond the users list cards.
- Running the Docker stack locally. Docker is not available in the development sandbox, so the compose change is verified by reading it against the existing CI workflow, not by running it.
- Dark-mode screenshots for every admin page. Dark mode is covered for the users cards, where the overflow was seen.

## Decisions

**Same build, two servers.** Local runs build once with `next build` and start the build twice with `next start`, on port 3000 with `DATABASE_URL` for `e2e` and on port 3001 with the `e2e_visual` URL. `test:e2e` and `test:e2e:visual` run the build before Playwright, so the build always matches the code under test. `next start` prints a warning about standalone output. That warning is harmless here, because the build is the same one the Docker image uses. Alternatives: two `next dev` servers (refused: the lock in `.next`); a separate `distDir` per server (rejected by the project owner, since it adds a config option and a tsconfig rewrite); running the visual server from a second checkout (duplicates `node_modules` and drifts).

**Visual database URL is derived from `DATABASE_URL`.** The helper replaces only the database name with `e2e_visual`, so a developer with one `.env` gets both databases. Alternative: a second env variable. Rejected because it doubles the configuration that developers and CI must keep in sync.

**Global setup prepares both databases.** It creates `e2e_visual` if missing (through the `postgres` maintenance database, with the name from a constant), runs `prisma migrate deploy` against both databases, then cleans and seeds each. A fresh local checkout therefore needs no manual database steps. Alternative: document `createdb` and `pnpm db:deploy` in the README only. Rejected because a missed step fails with a confusing "relation does not exist" error.

**Visual seed holds only visual data.** `seedTestData` no longer calls `seedVisualTestData`. The visual seed creates its own admin user and tenants, plus the data the new screens need: one pending user with an unbroken email (the overflow case and the pending tab), and one unassigned apartment in the visual HOA (the users management page). Seeded `createdAt` values are pinned to `VISUAL_FIXED_NOW`, so "Zarejestrowano" text does not change daily.

**Docker: same image, two containers.** `docker-compose.e2e.yaml` keeps one `db` service. A Postgres init script in `docker/` creates `e2e_visual`. The existing `ekartoteka` service stays on port 3000 with `e2e`. A second service, `ekartoteka-visual`, uses the same image on port 3001 with `e2e_visual`. Both run migrations at start, which requires the database to exist first, so the init script is needed even though global setup also creates the database. The E2E workflow exports `PLAYWRIGHT_VISUAL_BASE_URL=http://localhost:3001` and points `DATABASE_URL` at `e2e`.

**Admin visual tests are split by area.** `e2e/visual/admin-pages.spec.ts` becomes `admin-apartments.spec.ts`, `admin-import.spec.ts`, `admin-settings.spec.ts`, `admin-users.spec.ts` and `admin-users-management.spec.ts`. Each file stays under the 200-line limit. Helper `expectNoHorizontalOverflow(page)` in `e2e/utils/` compares `document.documentElement.scrollWidth` with the viewport width.

**Users list fix.** The cards container becomes `grid grid-cols-1 gap-4`. Tailwind v4 writes `grid-cols-1` as `repeat(1, minmax(0, 1fr))`, so the single column is bounded by the container instead of its content. Card text that can hold a long unbroken string (the apartment label) gets `min-w-0 break-words`, following the existing flex-row rule in the visual-design spec. Name and email already use `break-words` inside `min-w-0` containers and keep their current classes. The fix is verified by measuring `scrollWidth` at 360 px and 412 px, with and without the long email.

**Playwright configuration.** `webServer` becomes an array with two entries: `next start --port 3000` against `e2e`, and `next start --port 3001` against `e2e_visual`. Both use `reuseExistingServer: !CI`. Visual projects set `baseURL` to `PLAYWRIGHT_VISUAL_BASE_URL` (default `http://localhost:3001`). `PLAYWRIGHT_SKIP_WEBSERVER` still skips both servers in CI.

## Risks / Trade-offs

- [A local run needs a build first, about 45 s] → `test:e2e` and `test:e2e:visual` run `next build` before Playwright. Running `playwright test` directly without a build fails with Next's own "Could not find a production build" error.
- [Production build renders differently from dev] → The existing baselines were rendered from the CI Docker image, which is also a production build. Any baseline that changes is regenerated and reviewed in the diff.
- [Baselines differ between machines] → Chromium 1248 is pinned through `@playwright/test`. Baselines were regenerated on Linux with that build and matched the existing committed baselines for the apartment and import pages before any other change.
- [Compose change is not run locally] → The compose file is checked against `.github/workflows/e2e.yaml`. The first CI run is the verification; the task list says so.
- [Global setup runs migrations on a developer database] → The derived database name is fixed (`e2e_visual`), and `DATABASE_URL` is already wiped by existing global setup, so this adds no new risk to the functional database.
- [Baseline churn] → Existing admin baselines (apartments, import) are kept unless the page changes; new baselines are created with `--update-snapshots=missing`.

## Migration Plan

1. Land the change as commits per task group: the database split and the local run, the overflow fix with its test, the admin visual coverage with its baselines, and the compose and workflow change.
2. Create `e2e_visual` locally (done automatically by global setup) and run the full E2E suite, functional and visual.
3. Rollback: revert the commits. The old single-server configuration works again; the `e2e_test` database may be dropped.

## Open Questions

None. The points that would change the specs or the task breakdown were resolved above.
