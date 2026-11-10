# Tasks

## 1. Settings registry and per-setting readers

- [ ] 1.1 Add the `ParseResult<T>` type to `src/lib/settings/registry.ts`, change `parseYearsBack` and `parseAppSettingsUpdate` to return it (`{ ok: false; message? }` on failure), and update `src/lib/settings/__tests__/parse-years-back.test.ts` and `registry.test.ts`; verify with `pnpm vitest run src/lib/settings`.
- [ ] 1.2 Add `PRIVACY_POLICY_MAX_LENGTH` (50 000) to `src/lib/settings/constants.ts`, `PLACEHOLDER_PATTERN`, `placeholder(label)` and `countPlaceholders(text)` to `src/lib/privacy/placeholders.ts`, and `src/lib/settings/parse-privacy-policy.ts` (trim, `''` to `null`, length limit, unresolved `[[…]]` rejected with the Polish message from design D2) with tests; register `privacyPolicy` in `APP_SETTINGS`; verify with `pnpm vitest run src/lib/settings src/lib/privacy`.
- [ ] 1.3 Add `privacyPolicy String?` to `prisma/schema.prisma` and a migration `…_privacy_policy_setting` with `ADD COLUMN "privacyPolicy" TEXT` and the `AppSettings_privacyPolicy_length` `CHECK`; add a migration test next to the existing `app_settings_singleton` one covering a `NULL` default, a 50 000-character value accepted and a 50 001-character value rejected; verify with `pnpm prisma validate`, `pnpm prisma generate` and the migration test.
- [ ] 1.4 Replace `getAppSettings`/`readAppSettings` with the uncached `readSetting(key)` helper and the per-setting readers `getTenantHistoryYearsBack()` and `getPrivacyPolicy()` (design D2), delete `APP_SETTINGS_NON_SETTING_COLUMNS`, update `updateAppSettings` to read and return only the updated keys, and move every consumer (`tenant-history.ts`, `settings-section.tsx`) to the new readers; update the query, mutation and `tenant-history` tests, including that one request issues one query per setting and that the history window query selects only its column; verify with `pnpm vitest run src/lib/queries src/lib/mutations src/lib/settings`.
- [ ] 1.5 Update `updateSettingsAction` to return `invalid(message ?? INVALID_SETTINGS_MESSAGE)` and its data as `Partial<AppSettingsValues>`, adapt `useAppSettings` to the narrowed result, and extend `src/actions/settings/__tests__` with the policy cases (valid text, empty to `null`, over limit, unresolved placeholder, unknown key, non-admin); verify with `pnpm vitest run src/actions/settings src/components/settings`.

## 2. Safe Markdown rendering

- [ ] 2.1 Add `src/lib/privacy/markdown.ts` (blocks: headings 1–3, paragraphs, bulleted and numbered lists; inline: bold, links limited to `https:`, `http:`, `mailto:` and absolute single-slash paths) with `__tests__/markdown.test.ts` covering the supported syntax, joined paragraph lines, `javascript:` and `//host` targets kept as text, raw HTML kept as text and empty input; verify with `pnpm vitest run src/lib/privacy`.
- [ ] 2.2 Add `src/components/privacy/policy-text.tsx` that renders the blocks as React elements with Tailwind classes (no `dangerouslySetInnerHTML`, external links with `target="_blank"` and `rel="noopener noreferrer"`) and an optional `highlightPlaceholders` prop that wraps each `[[…]]` in a `<mark>`; add `__tests__/policy-text.test.tsx` covering each element, the escaped `<script>` text, the link attributes and the highlighting; verify with `pnpm vitest run src/components/privacy`.

## 3. Built-in template

- [ ] 3.1 Add `src/lib/privacy/template/` sections 1–8 of design D6 (`W skrócie` through `Czy musisz podać dane`) as Polish Markdown in files of under 200 lines, using `placeholder()` for everything an operator decides and marking optional parts for removal; verify with `pnpm vitest run src/lib/privacy` and a read-through of the rendered text for plain, correct Polish in the second person.
- [ ] 3.2 Add sections 9–18 (`Komu przekazujemy dane` through `Zmiany tej polityki`), including the rights list with the complaint address, the practical procedure with the one-month and two-month deadlines, the unexpected-e-mail explanation, the cookies section citing art. 399 and the security measures the code enforces, and `index.ts` exporting `PRIVACY_POLICY_TEMPLATE`; verify with the same command and read-through.
- [ ] 3.3 Add `__tests__/template.test.ts` asserting the headings the spec requires, placeholders for controller, retention and hosting, art. 399 in the cookie section, the one-month deadline sentence, that the text parses with `markdown.ts` without literal-Markdown fallbacks, and that none of a list of deployment-specific product and provider names appears; verify with `pnpm vitest run src/lib/privacy`.

## 4. Public page and proxy

- [ ] 4.1 Add `privacy: 'Polityka prywatności'` to `PAGE_TITLES`, `src/app/privacy/page.tsx` and a `PrivacyPolicySection` that calls `await connection()`, reads `getPrivacyPolicy()` and renders `PolicyText` or the not-published notice, with no session check; add `src/app/privacy/__tests__/page.test.tsx` for both states and the title; verify with `pnpm vitest run src/app/privacy`.
- [ ] 4.2 Add `'/privacy'` to `ALLOWED_PREFIXES` in `src/lib/auth/proxy-handler.ts` and extend `src/lib/auth/__tests__` with the allowed path, `/privacy/x` and the rejected `/privacy-anything` for a forced password change; verify with `pnpm vitest run src/lib/auth`.
- [ ] 4.3 Add `e2e/privacy/privacy-page.spec.ts` covering a signed-out visitor, a signed-in tenant, a user with a forced password change and the not-published state; verify with `pnpm exec playwright test e2e/privacy --trace off`.

## 5. Footer and layouts

- [ ] 5.1 Add `src/components/privacy/privacy-link.tsx` and `src/components/layout/app-footer.tsx` (version left and quieter, link right with `text-muted-foreground`, hover underline, visible focus, `min-h-11`, safe-area bottom padding) with tests for the version, the link target and text, and the classes that give the contrast and the 44 px area; verify with `pnpm vitest run src/components/layout src/components/privacy`.
- [ ] 5.2 Restructure `AuthShell` to a full-height flex column with the content area taking the free space and `AppFooter` last, remove the fixed version label, and update `auth-shell.test.tsx`; verify with `pnpm vitest run src/components/layout`.
- [ ] 5.3 Make `DashboardLayout` and `AdminLayout` full-height flex columns with `AppFooter` last, remove their fixed version labels, change `Page` from `min-h-screen` to `flex-1`, add `src/app/privacy/layout.tsx` with the same structure, and audit every use of `Page` for a flex-column parent; update the affected page and layout tests; verify with `pnpm vitest run src/app src/components/layout` and a list of the audited uses in the commit message.
- [ ] 5.4 Add `e2e/layout/footer.spec.ts` covering the link and version on each page group, the footer at the bottom edge of a short page without page scroll, under the content of a long page, no horizontal scroll at 390 px, and that the link works; update the visual baselines for the pages whose layout changed; verify with `pnpm exec playwright test e2e/layout e2e/visual --trace off`.

## 6. Admin editor

- [ ] 6.1 Add the shadcn `Textarea` and `Badge` primitives to `src/components/ui` with render tests; verify with `pnpm vitest run src/components/ui`.
- [ ] 6.2 Add `use-privacy-policy-editor.ts` (draft, saved, tab, saving, status, remaining placeholders, dirty flag, dynamic template import with confirmation, save through `updateSettingsAction`, confirmation on closing with unsaved changes) with `__tests__/use-privacy-policy-editor.test.ts`; verify with `pnpm vitest run src/components/settings`.
- [ ] 6.3 Add `privacy-policy-card.tsx` and `privacy-policy-dialog.tsx` (status card with the badge and buttons, modal with `Podgląd` and `Edycja` tabs, preview with highlighted placeholders, empty state, footer with the template button, placeholder count and the save and cancel buttons, full-screen on a phone), render the card as the second card in `SettingsContent` and pass the initial text from `SettingsSection`; add component tests for both states of the card, the default preview, the tab switch, the placeholder count, the template confirmation and the error alert; verify with `pnpm vitest run src/components/settings`.
- [ ] 6.4 Add `e2e/admin/privacy-policy-settings.spec.ts` covering load template, unresolved placeholder rejection, save, the text appearing on `/privacy`, clearing it, and closing with unsaved changes; verify with `pnpm exec playwright test e2e/admin/privacy-policy-settings.spec.ts --trace off`.

## 7. E-mail footer

- [ ] 7.1 Add the footer link with `appUrl('/privacy')` to `EmailLayout`; extend the email template tests for the link in the HTML, once in the text part, and in the account activation email; verify with `pnpm vitest run src/components/email src/lib/email`.

## 8. Documentation and specs

- [ ] 8.1 Add `docs/privacy-policy.md` (where to edit, supported syntax, each placeholder, which sections to remove, the review caveat), link it from the `README.md` table, and update `docs/architecture.md` and `docs/code-conventions.md` where they describe settings reads or layouts; verify every command and path in the page against the code.
- [ ] 8.2 Add the `privacy-policy` entry to the specs index in `openspec/config.yaml`; verify with `openspec validate add-privacy-policy --strict`.

## 9. Integration

- [ ] 9.1 Run `pnpm lint`, `pnpm exec prettier --check .`, `pnpm exec tsc --noEmit` and `pnpm vitest run`, then `pnpm build` and confirm `/privacy` is listed as dynamic; verify all pass and fix what they report.

## Workflow follow-up

- Apply `redact-personal-data-from-logs` first, because the template describes its result.
- Archive both changes with `openspec-archive-change` before the pull request is merged: the CI lint job fails while an unarchived change exists.
- Open the pull request with the operator's policy text for the deployment attached.
