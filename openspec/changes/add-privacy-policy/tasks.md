# Tasks

## 1. Settings registry and per-setting readers

- [ ] 1.1 Add the `ParseResult<T>` type to `src/lib/settings/registry.ts`, change `parseYearsBack` and `parseAppSettingsUpdate` to return it (`{ ok: false; message? }` on failure), and update `src/lib/settings/__tests__/parse-years-back.test.ts` and `registry.test.ts`; verify with `pnpm vitest run src/lib/settings`.
- [ ] 1.2 Add `PRIVACY_POLICY_MAX_LENGTH` (50 000) to `src/lib/settings/constants.ts`, `PLACEHOLDER_PATTERN` and `placeholder(label)` to `src/lib/privacy/placeholders.ts`, and `src/lib/settings/parse-privacy-policy.ts` (trim, `''` to `null`, length limit, unresolved `[[…]]` rejected with the Polish message from design D2) with `__tests__/parse-privacy-policy.test.ts`; register `privacyPolicy` in `APP_SETTINGS`; verify with `pnpm vitest run src/lib/settings src/lib/privacy`.
- [ ] 1.3 Add `privacyPolicy String?` to `prisma/schema.prisma` and a migration `…_privacy_policy_setting` with `ADD COLUMN "privacyPolicy" TEXT` and the `AppSettings_privacyPolicy_length` `CHECK`; add a migration test next to the existing `app_settings_singleton` one that covers a `NULL` default, a 50 000-character value accepted and a 50 001-character value rejected; verify with `pnpm prisma validate`, `pnpm prisma generate` and the migration test.
- [ ] 1.4 Replace `getAppSettings`/`readAppSettings` with the uncached `readSetting(key)` helper and the per-setting readers `getTenantHistoryYearsBack()` and `getPrivacyPolicy()` (design D2), delete `APP_SETTINGS_NON_SETTING_COLUMNS`, update `updateAppSettings` to read and return only the updated keys, and move every consumer (`tenant-history.ts`, `settings-section.tsx`) to the new readers; update the query, mutation and `tenant-history` tests, including a test that one request issues one query per setting and that the history window query selects only its column; verify with `pnpm vitest run src/lib/queries src/lib/mutations src/lib/settings`.
- [ ] 1.5 Update `updateSettingsAction` to return `invalid(message ?? INVALID_SETTINGS_MESSAGE)` and its data as `Partial<AppSettingsValues>`, adapt `useAppSettings` to the narrowed result, and extend `src/actions/settings/__tests__` with the policy cases (valid text, empty to `null`, over limit, unresolved placeholder, unknown key, non-admin); verify with `pnpm vitest run src/actions/settings src/components/settings`.

## 2. Safe Markdown rendering

- [ ] 2.1 Add `src/lib/privacy/markdown.ts` (blocks: headings 1–3, paragraphs, bulleted and numbered lists; inline: bold, links limited to `https:`, `http:`, `mailto:` and absolute single-slash paths) with `__tests__/markdown.test.ts` covering the supported syntax, joined paragraph lines, `javascript:` and `//host` targets kept as text, raw HTML kept as text and empty input; verify with `pnpm vitest run src/lib/privacy`.
- [ ] 2.2 Add `src/components/privacy/policy-text.tsx` that renders the blocks as React elements with Tailwind classes (no `dangerouslySetInnerHTML`, external links with `target="_blank"` and `rel="noopener noreferrer"`) and `__tests__/policy-text.test.tsx` covering each element, the escaped `<script>` text and the link attributes; verify with `pnpm vitest run src/components/privacy`.

## 3. Built-in template

- [ ] 3.1 Add `src/lib/privacy/template/` with one file per group of the 13 sections in design D6 (each under 200 lines, Polish text, `[[…]]` placeholders through `placeholder()`, optional parts marked for removal) and `index.ts` exporting `PRIVACY_POLICY_TEMPLATE`; add `__tests__/template.test.ts` asserting the headings required by the spec, placeholders for controller, retention and hosting, art. 399 of the Electronic Communications Law in the cookie section, that the text parses with `markdown.ts` without plain-text link fallbacks, and that none of a list of deployment-specific product and provider names appears; verify with `pnpm vitest run src/lib/privacy`.

## 4. Public page and proxy

- [ ] 4.1 Add `privacy: 'Polityka prywatności'` to `PAGE_TITLES` and `src/app/privacy/page.tsx` plus a `PrivacyPolicySection` that calls `await connection()`, reads `getPrivacyPolicy()` and renders `PolicyText` or the not-published notice, with no session check; add `src/app/privacy/__tests__/page.test.tsx` for both states and the title; verify with `pnpm vitest run src/app/privacy`.
- [ ] 4.2 Add `'/privacy'` to `ALLOWED_PREFIXES` in `src/lib/auth/proxy-handler.ts` and extend `src/lib/auth/__tests__` with the allowed path, `/privacy/x` and the rejected `/privacy-anything` for a forced password change; verify with `pnpm vitest run src/lib/auth`.
- [ ] 4.3 Add `e2e/privacy/privacy-page.spec.ts` covering a signed-out visitor, a signed-in tenant, a user with a forced password change and the not-published state; verify with `pnpm exec playwright test e2e/privacy --trace off`.

## 5. Admin editor

- [ ] 5.1 Add the shadcn `Textarea` primitive to `src/components/ui/textarea.tsx` with a render test; verify with `pnpm vitest run src/components/ui`.
- [ ] 5.2 Add `use-privacy-policy-form.ts` (state, dynamic template import, confirm before replacing text, save through `updateSettingsAction`, status handling) with `__tests__/use-privacy-policy-form.test.ts`; verify with `pnpm vitest run src/components/settings`.
- [ ] 5.3 Add `privacy-policy-form.tsx` (labelled text area, syntax and limit hint, `Wczytaj szablon`, `Zapisz`, success and error alerts), render it as a second card in `SettingsContent` and pass the initial text from `SettingsSection`; add component tests for the saved text, loading the template, the confirmation and the error alert; verify with `pnpm vitest run src/components/settings`.
- [ ] 5.4 Add `e2e/admin/privacy-policy-settings.spec.ts` covering load template, unresolved placeholder rejection, save, the text appearing on `/privacy` and clearing it; verify with `pnpm exec playwright test e2e/admin/privacy-policy-settings.spec.ts --trace off`.

## 6. Links and notices

- [ ] 6.1 Add `src/components/privacy/privacy-link.tsx`, `privacy-notice.tsx` and `privacy-card.tsx` with tests for the link target and text, the notice sentence and the profile card copy; verify with `pnpm vitest run src/components/privacy`.
- [ ] 6.2 Add the link to `AuthShell`, the notice to the login and register pages, the link next to the version in the dashboard and admin layouts, and the card to the profile page; update the affected page and layout tests; verify with `pnpm vitest run src/components/layout src/app`.
- [ ] 6.3 Add the footer link with `appUrl('/privacy')` to `EmailLayout`; extend the email template tests for the link in the HTML, once in the text part, and in the account activation email; verify with `pnpm vitest run src/components/email src/lib/email`.
- [ ] 6.4 Extend an existing auth e2e spec to assert the link on the login and register pages and the notice sentence without a checkbox, and update the visual baselines for the pages whose footer changed; verify with `pnpm exec playwright test e2e/auth e2e/visual --trace off`.

## 7. Documentation and specs

- [ ] 7.1 Add `docs/privacy-policy.md` (where to edit, supported syntax, each placeholder, which sections to remove, the review caveat), link it from the `README.md` table, and update `docs/architecture.md` and `docs/code-conventions.md` where they describe settings reads; verify every command and path in the page against the code.
- [ ] 7.2 Add the `privacy-policy` entry to the specs index in `openspec/config.yaml`; verify with `openspec validate add-privacy-policy --strict`.

## 8. Integration

- [ ] 8.1 Run `pnpm lint`, `pnpm exec prettier --check .`, `pnpm exec tsc --noEmit` and `pnpm vitest run`, then `pnpm build` and confirm `/privacy` is listed as dynamic; verify all pass and fix what they report.

## Workflow follow-up

- Archive the change with `openspec-archive-change` after review, which syncs the delta specs into `openspec/specs`.
- Open the pull request with the operator's policy text for the deployment attached.
