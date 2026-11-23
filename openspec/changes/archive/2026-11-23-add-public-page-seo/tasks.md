# Tasks

## 1. Metadata Helper

- [x] 1.1 Add `src/lib/framework/seo.ts` with `PUBLIC_PAGES` (path, title, description for login, register, forgot-password, privacy), `publicPageMetadata()` and the site description; verify with `src/lib/framework/__tests__/seo.test.ts`
- [x] 1.2 Test the helper: relative canonical per page, `index, follow`, Open Graph type/site name/locale/title/description, `summary` Twitter card, no image fields, four distinct descriptions — verify with `pnpm vitest --run src/lib/framework/__tests__/seo.test.ts`

## 2. Public Pages

- [x] 2.1 Point the login, register and forgot-password layouts at `publicPageMetadata`; verify `pnpm vitest --run src/app` keeps their title tests passing
- [x] 2.2 Point the privacy layout at `publicPageMetadata`; verify its title and canonical tests pass
- [x] 2.3 Test each public layout's exported `metadata` (title, description, canonical, robots, Open Graph) in one route test, `src/app/__tests__/seo-routes.test.ts`

## 3. Private by Default

- [x] 3.1 Add `robots: { index: false, follow: false }` and the site description to the root layout metadata; verify the root default in `src/app/__tests__/seo-routes.test.ts`
- [x] 3.2 Assert the token pages (`/reset-password`, `/verify-email`) export no `index` metadata, so they inherit the default; verify with the same test

## 4. Static Build

- [x] 4.1 Run `pnpm build` and confirm `/login`, `/register`, `/forgot-password` and `/change-password` are still static routes and no page turned request-time, and that the build prints no `metadataBase` warning
- [x] 4.2 Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm exec prettier --check .` and `CI=1 pnpm test` with no stderr or stdout blocks

## Workflow follow-up

- Add `openspec/specs/public-seo/spec.md` to the spec index in `openspec/config.yaml` after archiving.
- Archive the change with the OpenSpec archive skill.
