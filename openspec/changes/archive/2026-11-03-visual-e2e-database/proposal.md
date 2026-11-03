## Why

Visual regression snapshots and functional E2E tests share one database, so every functional spec that creates or deletes users changes the users shown on admin screens. The admin visual suite therefore covers only pages whose data is fixed, and the admin users list (the most data-dependent admin page) has no visual coverage at all.

Visual coverage also missed a real regression: an unbroken email on the admin users list widens the whole list and makes the page scroll horizontally on phones.

## What Changes

- Visual E2E tests run against their own database `e2e_visual` on a second app server (`http://localhost:3001`). Functional E2E keeps database `e2e` on `http://localhost:3000`. The existing database name `e2e_test` becomes `e2e` in the E2E compose stack and the E2E workflow.
- Global setup creates `e2e_visual` when it is missing, applies Prisma migrations to both databases, then cleans and seeds each one. The functional seed no longer creates visual users. Global teardown cleans both databases.
- Local runs build the app once and start that build twice with `next start`, once per database, the same way the Docker stack runs one image twice with different database URLs.
- `docker-compose.e2e.yaml` starts a second app container for the visual database and creates `e2e_visual` on first database start.
- Every admin page gets visual coverage: HOA list, HOA apartments, apartment details, import, settings, users (pending, all as cards, all as table, dark mode, create-user dialog) and users management. Each admin visual test asserts the page does not scroll horizontally.
- Admin user cards keep long unbroken text inside the card, so the list no longer widens past the viewport. **No change to the data shown or to user actions.**
- Seeded visual users get pinned creation timestamps so "Zarejestrowano" dates do not change daily.

## Capabilities

### New Capabilities

None. Visual regression tests are part of the existing `testing` capability.

### Modified Capabilities

- `testing`: the E2E infrastructure requirement describes two databases and two servers, and a visual regression requirement is added (admin and tenant snapshot coverage, visual database, no horizontal scroll on admin pages).
- `visual-design`: the responsive layout requirement adds a scenario for unbroken text in admin user cards and a scenario requiring admin pages to not scroll horizontally.

## Impact

- Playwright configuration (`playwright.config.ts`): two `webServer` entries, visual projects use the visual base URL.
- Package scripts (`package.json`): `test:e2e` and `test:e2e:visual` build the app before running Playwright.
- E2E code: `e2e/global-setup.ts`, `e2e/global-teardown.ts`, `e2e/utils/seed-test-data.ts`, `e2e/utils/seed-visual-test-data.ts`, new `e2e/utils/` helpers for database URLs and the overflow assertion, new SQL files in `e2e/test-data/seed/`.
- Visual specs: `e2e/visual/admin-pages.spec.ts` is split into per-area admin specs; baselines for new screens are generated.
- Infrastructure: `docker-compose.e2e.yaml`, a Postgres init script, `.github/workflows/e2e.yaml`, `README.md` testing notes, `openspec/config.yaml`.
- Application UI: `src/components/users/users-list.tsx` and `src/components/users/user-card.tsx` only.
- No API, data model or migration changes.
