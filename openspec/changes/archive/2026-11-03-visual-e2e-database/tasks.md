# Tasks

## 1. Dedicated visual database and server

- [x] 1.1 Add `e2e/utils/database-urls.ts` with the names `e2e` and `e2e_visual` and a helper that replaces the database name of a URL; verify the global setup run in 1.4 logs the derived URL
- [x] 1.2 Add `e2e/utils/ensure-database.ts` that creates a missing database through the `postgres` maintenance database (existence check in `e2e/test-data/seed/`) and runs `prisma migrate deploy` against the given URL; verify a run against an empty `e2e_visual` creates and migrates it
- [x] 1.3 Move visual seeding out of `seed-test-data.ts`: `seed-visual-test-data.ts` creates its own admin user, and the functional seed creates no visual users; verify `e2e` has no `visual*@e2e-test.com` users after a seed run
- [x] 1.4 Update `e2e/global-setup.ts` and `e2e/global-teardown.ts` to prepare, clean and seed (teardown: clean) both databases; verify `pnpm build && pnpm exec playwright test e2e/dashboard --project=chromium` passes against `e2e`
- [x] 1.5 Update `playwright.config.ts` with two `webServer` entries running `next start` on ports 3000 and 3001 with `e2e` and `e2e_visual`, and visual projects using `PLAYWRIGHT_VISUAL_BASE_URL`; add `next build` before Playwright in the `test:e2e` and `test:e2e:visual` scripts; verify `pnpm test:e2e:visual` builds, starts both servers and passes the existing tenant specs with their baselines

## 2. Users list overflow

- [x] 2.1 Change the users cards container in `src/components/users/users-list.tsx` to `grid grid-cols-1 gap-4` and add `min-w-0 break-words` to the apartment label in `src/components/users/user-card.tsx`; verify the 360 px probe from design.md reports `scrollWidth` 360 with an unbroken email (checked with a 58-character email)
- [x] 2.2 Add a pending visual user with an unbroken email to the visual seed; verify the row exists in `e2e_visual` and shows on the pending tab

## 3. Visual coverage of every admin page

- [x] 3.1 Pin `createdAt` of visual users to `VISUAL_FIXED_NOW` through a SQL file in `e2e/test-data/seed/`, and add an unassigned apartment in the visual HOA; verify a second seed run leaves the same dates and one unassigned apartment
- [x] 3.2 Add `e2e/utils/expect-no-horizontal-overflow.ts` comparing `document.documentElement.scrollWidth` with the viewport width; verify it fails on the unfixed users list (task 2.1 reverted) and passes after the fix
- [x] 3.3 Split `e2e/visual/admin-pages.spec.ts` into `admin-apartments.spec.ts` (HOA list, HOA apartments, apartment details), `admin-import.spec.ts` and `admin-settings.spec.ts`, each with the overflow assertion; verify the existing apartment and import baselines still match and the settings baseline is created with `--update-snapshots=missing`
- [x] 3.4 Add `e2e/visual/admin-users.spec.ts` covering pending, all as cards (with overflow assertion), all as a table, dark cards and the create-user dialog; verify it passes on `visual-desktop` and `visual-mobile` with baselines created by `--update-snapshots=missing`
- [x] 3.5 Add `e2e/visual/admin-users-management.spec.ts` for `/admin/users/management` with the unassigned apartment visible; verify it passes on both visual projects with baselines created the same way

## 4. Docker and CI/CD E2E

- [x] 4.1 Update `docker-compose.e2e.yaml`: database `e2e`, a Postgres init script in `docker/` creating `e2e_visual`, and a second app service `ekartoteka-visual` on port 3001 with the same image, healthcheck and environment except `DATABASE_URL`; verify the YAML parses and the ports and database names match `e2e/utils/database-urls.ts`
- [x] 4.2 Update `.github/workflows/e2e.yaml` to use database `e2e` and export `PLAYWRIGHT_VISUAL_BASE_URL=http://localhost:3001`, and make the readiness wait cover both containers; verify the YAML parses and the health check waits for both services (first CI run is the end-to-end check, Docker is not available in the development sandbox)
- [x] 4.3 Update `.github/workflows/performance.yaml` so its database URL uses `e2e` instead of `e2e_test`, matching the compose database; verify the YAML parses and no `e2e_test` reference is left in `.github/` or `docker-compose*.yaml`
- [x] 4.4 Update the testing commands and local setup notes in `README.md` (two databases, two servers from one build, `pnpm test:e2e:visual`); verify every command named in the section exists in `package.json`
- [x] 4.5 Update the E2E line in `openspec/config.yaml` to mention both databases; verify `openspec validate visual-e2e-database --strict` passes

## 5. Integration check

- [x] 5.1 Run `pnpm test`, `pnpm lint`, `pnpm format:check` and then the full `pnpm test:e2e` and `pnpm test:e2e:visual` locally; verify all pass, or report each failure with its output

## Workflow follow-up

- The Docker E2E stack (`docker-compose.e2e.yaml`, `e2e.yaml`, `performance.yaml`) has not been run locally, because Docker is not available in the development sandbox. The first CI run is its check.
- Ask the user for approval of the final code before committing and pushing to the designated branch.
- Archive the change with the `openspec-archive-change` skill after the user approves, so the main specs are updated.
