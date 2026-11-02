# Tasks

## 1. Logout without a page reload

- [x] 1.1 Add `useLogout` in `src/components/account/use-logout.ts` (`signOut({ redirect: false })`, `router.replace('/login')`, `router.refresh()`, `pending` state) and use it in `LogoutButton`; verify `src/components/account/__tests__/use-logout.test.ts` and `logout-button.test.tsx` cover success, failure and the disabled state
- [ ] 1.2 Extend `e2e/auth/logout.spec.ts` to assert the login page is reached without a document reload (same navigation entry via `page.evaluate` marker); verify the Logout E2E suite

## 2. Orphaned session

- [x] 2.1 Add `OrphanedSessionSignOut` in `src/components/account/orphaned-session-sign-out.tsx`, calling `useLogout` on mount and rendering nothing
- [x] 2.2 Render it from `src/app/dashboard/layout.tsx` instead of `children` when `findUserByIdCached` returns `null`; add `src/app/dashboard/__tests__/layout.test.tsx` covering a normal user, a deleted user (children not rendered, sign-out component rendered) and the unauthenticated redirect
- [x] 2.3 Add a component test `src/components/account/__tests__/orphaned-session-sign-out.test.tsx` asserting `logout` runs once on mount

## 3. Remove the Server Action

- [x] 3.1 Replace `refreshSessionAndRedirect` in `src/app/change-password/page.tsx` with `useSession().update()`, `router.replace('/dashboard')` and `router.refresh()`; delete `actions.ts` and `actions.test.ts`; verify `src/app/change-password/__tests__/page.test.tsx`
- [ ] 3.2 Confirm no `'use server'` remains with `rg "'use server'" src` and that the existing change-password E2E flow still reaches `/dashboard`

## 4. Deployment ID

- [x] 4.1 Set `deploymentId: process.env.DEPLOYMENT_ID || undefined` in `next.config.ts`; verify with a unit test of the config module or a build that `DEPLOYMENT_ID=abc pnpm build` emits `?dpl=abc` asset URLs
- [x] 4.2 Add `ARG DEPLOYMENT_ID` / `ENV DEPLOYMENT_ID=$DEPLOYMENT_ID` to the builder stage in `docker/Dockerfile` and `build-args: DEPLOYMENT_ID=${{ github.sha }}` to the CI image build; verify with `docker build --build-arg DEPLOYMENT_ID=test` and `docker/dpl` in the built output

## 5. CI check for open OpenSpec changes

- [x] 5.1 Delete `eslint-rules/no-unarchived-openspec-changes.mjs`, its test, its registration in `eslint-rules/index.mjs` and its block in `eslint.config.mjs`; verify `pnpm eslint eslint.config.mjs eslint-rules` passes
- [x] 5.2 Add the "Check for unarchived OpenSpec changes" step before ESLint in `.github/workflows/test-and-build.yaml`; verify the snippet exits 1 with a probe folder and 0 without

## 6. Docs and specs

- [x] 6.1 Reword the forced-password-change line in `AGENTS.md` (token flag is a redirect hint)
- [x] 6.2 Update `openspec/config.yaml` context (session carries `sub` and `mustChangePassword`, not role and status; the flag is a redirect hint; ESLint rule removed); verify nothing else in the file contradicts the specs
- [ ] 6.3 Run `openspec validate harden-session-lifecycle`, then archive the change so the `authentication` and `tooling` specs are updated; verify `openspec/changes/` contains only `archive/`

## 7. Verification

- [x] 7.1 Run `pnpm lint`, `pnpm format:check`, `pnpm exec tsc --noEmit` and `pnpm test --run`; verify all pass
