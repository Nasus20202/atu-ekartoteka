# Tasks

## 1. Shared building blocks

- [x] 1.1 Add `src/lib/auth/form-placeholders.ts` with the Polish placeholder
      constants from design D6 and a unit test in
      `src/lib/auth/__tests__/form-placeholders.test.ts`; verify with
      `pnpm vitest run src/lib/auth/__tests__/form-placeholders.test.ts`.
- [x] 1.2 Move `src/components/account/password-input.tsx` to
      `src/components/ui/password-input.tsx`, widen it to
      `Omit<React.ComponentProps<typeof Input>, 'type' | 'onChange'>` with
      `onChange: (value: string) => void`, add the focus ring and `pr-10`
      padding, and add `src/components/ui/__tests__/password-input.test.tsx`
      covering masking, `Pokaż hasło`/`Ukryj hasło`, pass-through props and
      no form submit; verify with `pnpm vitest run
src/components/ui/__tests__/password-input.test.tsx`.
- [x] 1.3 Update `src/components/account/profile-form.tsx` and its tests to
      import the moved control; verify with `pnpm vitest run
src/components/account/__tests__/profile-form.test.tsx`.

## 2. Config caching and widget slots

- [x] 2.1 Add the `Cache-Control: public, max-age=300` header to
      `src/app/api/config/turnstile/route.ts` and
      `src/app/api/config/google/route.ts` (design D2), add a route test file
      for the Google route if missing, and assert the header plus the unchanged
      payloads in both route tests; verify with `pnpm vitest run
src/app/api/config`.
- [x] 2.2 Change `src/components/auth/use-google-sign-in-enabled.ts` to return
      `boolean | null` (null while unknown); update
      `src/components/auth/__tests__/use-google-sign-in-enabled.test.ts` for
      the three states; verify with `pnpm vitest run
src/components/auth/__tests__/use-google-sign-in-enabled.test.ts`.
- [x] 2.3 Rework `src/components/auth/turnstile-field.tsx`: skeleton with the
      reserved widget height while config is unknown, nothing when disabled,
      `options={{ theme: 'auto', size: 'flexible', language: 'pl' }}` when
      enabled, and a stable slot height across states; update
      `src/components/auth/__tests__/turnstile-field.test.tsx` for each state;
      verify with `pnpm vitest run
src/components/auth/__tests__/turnstile-field.test.tsx`.
- [x] 2.4 Add the tri-state Google slot (divider + button skeleton while
      unknown, `GoogleSignIn` when enabled, nothing when disabled) with unit
      tests for all three states; verify with `pnpm vitest run
src/components/auth/__tests__/google-sign-in.test.tsx`.
- [x] 2.5 Update `src/app/login/page.tsx`: instructional placeholders,
      `PasswordInput` for the password, action order submit → `Lub` divider →
      Google → register link, `bg-card` divider label, `AnimatedAlert` for the
      error, spinner + `Logowanie...` while submitting; extend
      `src/app/login/__tests__/page.test.tsx` for field placeholders, password
      toggle, action order, loading state and Google slot; verify with
      `pnpm vitest run src/app/login/__tests__/page.test.tsx`.
- [x] 2.6 Extend `e2e/auth/login.spec.ts` with a browser test for the
      instructional placeholders, the `Pokaż hasło` toggle, the submit →
      Google → register order, and the `Cache-Control` header returned by
      `/api/config/turnstile`; verify with `pnpm build && pnpm exec playwright
test e2e/auth/login.spec.ts --project='chromium*'`.

## 3. Remaining auth pages

- [x] 3.1 Update `src/app/register/page.tsx`: name/email/password/confirm
      placeholders, `PasswordInput` for both password fields with
      `autoComplete="new-password"`, `AnimatedAlert` for the error; extend
      `src/app/register/__tests__/page.test.tsx` for placeholders and toggles;
      verify with `pnpm vitest run src/app/register/__tests__/page.test.tsx`.
- [x] 3.2 Update `src/app/forgot-password/page.tsx`: email placeholder,
      `AnimatedAlert` for the error; extend
      `src/app/forgot-password/__tests__/page.test.tsx`; verify with
      `pnpm vitest run src/app/forgot-password/__tests__/page.test.tsx`.
- [x] 3.3 Update `src/app/reset-password/page.tsx`: new-password/confirm
      placeholders, `PasswordInput` for both fields with
      `autoComplete="new-password"`, `AnimatedAlert` for the error; extend
      `src/app/reset-password/__tests__/page.test.tsx`; verify with
      `pnpm vitest run src/app/reset-password/__tests__/page.test.tsx`.

## 4. Integration verification

- [x] 4.1 Regenerate the auth visual snapshots with
      `pnpm test:e2e:visual:update` and review the four login/register/
      forgot-password images (desktop and mobile) against the agreed design;
      verify with a second `pnpm test:e2e:visual` run that passes without diffs.
- [ ] 4.2 Run the auth and Google integration suites against a production build
      with `pnpm build` and
      `pnpm exec playwright test e2e/auth e2e/integrations/google-login.spec.ts --project='chromium*'`,
      then confirm every test passes.
- [x] 4.3 Run `pnpm lint`, `pnpm format:check` and `pnpm vitest run` and confirm
      they pass with no unrelated changes.

## 5. Visual coverage

- [x] 5.1 Remove the `className="turnstile-widget"` hook and the dark-mode
      `clip-path` outline workaround so the real Cloudflare widget renders
      untouched in light and dark mode; verify with
      `pnpm vitest run src/components/auth/__tests__/turnstile-field.test.tsx`.
- [x] 5.2 Enable dummy Turnstile credentials on the visual app server in
      `playwright.config.ts`, add the fake script in
      `e2e/utils/fake-turnstile-widget.js` and the `stubVisibleTurnstileWidget`
      helper in `e2e/utils/mock-server.ts`, wait for the fake widget in
      `e2e/visual/public-pages.spec.ts`, regenerate the public-page snapshots
      and verify with a second `pnpm test:e2e:visual` run.

## Workflow follow-up

- Archive the change after the project review requirements are satisfied.
- Verify the archived authentication spec contains the new requirements.
