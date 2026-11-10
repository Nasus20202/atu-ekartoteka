# Design

## Context

See proposal.md for motivation. Current state that shapes the approach:

- `AppSettings` is a single row (`id = 1`) with one typed column per setting and its `CHECK`s in the migration. `src/lib/settings/registry.ts` defines each setting as `{ defaultValue, parse }`, where `parse` returns `null` for an invalid value. `getAppSettings()` reads the whole row (omitting `id` and `updatedAt`) behind a request-scoped `cache()`, and `updateAppSettings()` compares and returns the whole row. `updateSettingsAction` validates with `parseAppSettingsUpdate` and is the only settings write path.
- The tenant history window is read on tenant requests, so a large column added to the row must not be read with it.
- The proxy redirects every path except `ALLOWED_PREFIXES` for users whose token says `mustChangePassword`. Pages are public unless they call `getSession()` themselves, and a page that reads the database at request time calls `await connection()`.
- The version label is a `fixed bottom-4 left-4` element in `AuthShell`, `DashboardLayout` and `AdminLayout`. Only the `AuthShell` test refers to it. `Page` is `min-h-screen`, and it sits under the sticky navbar, so a panel page is already taller than the screen by the navbar height.
- `EmailLayout` renders the footer of all five e-mails and `appUrl()` builds absolute URLs.
- `ui/dialog`, `ui/tabs`, `ui/card` and `useConfirm` exist. `Textarea` and `Badge` primitives do not. No Markdown library is installed.

## Goals / Non-Goals

**Goals:**

- Keep the repository free of deployment-specific content: the policy text is data, the template describes only the software.
- A template that an operator can publish after filling in placeholders, not a skeleton.
- No new dependency and no raw HTML anywhere in the rendering path.
- Reading one setting never loads another.
- A footer that never covers content and never makes a short page scroll.

**Non-Goals:**

- Cookie banner, consent checkboxes, versioning, "last updated" date, policy history.
- Generating template sections from runtime configuration (Turnstile, Google, tracking). The operator removes what does not apply.
- Account deletion, data export and retention jobs. Logs are handled by `redact-personal-data-from-logs`.

## Decisions

### 1. Storage: nullable `privacyPolicy` column on `AppSettings`

`ALTER TABLE "AppSettings" ADD COLUMN "privacyPolicy" TEXT` with `CONSTRAINT "AppSettings_privacyPolicy_length" CHECK (char_length("privacyPolicy") <= 50000)`. `NULL` means "not configured" and passes the constraint. The migration is additive. Prisma model: `privacyPolicy String?`.

Alternatives: a separate table (a new singleton for one field), an env var or mounted file (needs a rollout per edit, defeats the override), the registry as is (every settings read would load the text).

### 2. Registry: parse result and per-setting readers

```ts
type ParseResult<T> = { ok: true; value: T } | { ok: false; message?: string };

export const APP_SETTINGS = {
  tenantHistoryYearsBack: { defaultValue: 2, parse: parseYearsBack },
  privacyPolicy: {
    defaultValue: null as string | null,
    parse: parsePrivacyPolicy,
  },
} satisfies Record<string, SettingDefinition<unknown>>;
```

- A result object makes `null` a legal value and lets a failure carry a Polish message. `parseAppSettingsUpdate(body)` returns `{ ok: true; values } | { ok: false; message? }`, and `updateSettingsAction` returns `invalid(message ?? INVALID_SETTINGS_MESSAGE)`.
- `parsePrivacyPolicy` accepts a string, trims it, maps `''` to `null`, rejects text over `PRIVACY_POLICY_MAX_LENGTH` (50 000) and text that still matches `PLACEHOLDER_PATTERN` (`/\[\[[^\]]*\]\]/`), with the message `Uzupełnij lub usuń pola oznaczone podwójnymi nawiasami kwadratowymi [[…]]`.
- One uncached `readSetting(key)` runs `findUnique({ where: { id: APP_SETTINGS_ROW_ID }, select: { [key]: true } })` and falls back to the key's default when the row is missing. Per-setting readers wrap it in a no-argument `cache()`: `getTenantHistoryYearsBack()` and `getPrivacyPolicy()`.
- `getAppSettings`, `readAppSettings` and `APP_SETTINGS_NON_SETTING_COLUMNS` are deleted. `updateAppSettings(values)` reads only the keys being updated for its change check, upserts, and returns only those keys, so saving the history window never reads the policy.
- The action result data type becomes `Partial<AppSettingsValues>`; `useAppSettings` reads its value from it defensively.

Alternatives: a cached `getAppSettings(keys)` with a per-request `Map` (more code and a cast for no current benefit), omitting the policy from the full read (hides the problem, keeps the full-row API).

### 3. Page `/privacy`

`src/app/privacy/layout.tsx` is a flex column with the footer (decision 7) and `src/app/privacy/page.tsx` is a Server Component with no session check and `metadata.title = PAGE_TITLES.privacy`. A `Suspense` section calls `await connection()`, reads `getPrivacyPolicy()` and renders `PolicyText` or the notice `Polityka prywatności nie została jeszcze opublikowana.`.

The proxy: `'/privacy'` is added to `ALLOWED_PREFIXES`. `matchesPrefix` is segment-aware, so `/privacy-anything` still redirects.

### 4. Rendering a Markdown subset without a library

`src/lib/privacy/markdown.ts` parses text into blocks (`heading` 1–3, `paragraph`, `list` with `ordered` and items) whose inline parts are `text`, `bold` or `link`. A blank line ends a block; `#`, `##`, `###` start a heading; `- ` or `* ` lines form a bulleted list; `1. ` lines a numbered list; anything else is a paragraph, with consecutive lines joined by a space. `**text**` is bold; `[text](target)` is a link when `target` is `https:`, `http:`, `mailto:` or a path starting with a single `/`; any other target keeps the whole `[text](target)` as plain text.

`src/components/privacy/policy-text.tsx` maps the blocks to elements with Tailwind classes. No `dangerouslySetInnerHTML`, so raw HTML is shown as text and no CSP change is needed. External links get `target="_blank"` and `rel="noopener noreferrer"`. An optional `highlightPlaceholders` prop wraps every `[[…]]` match in a `<mark>`, which the editor preview uses.

Why not `react-markdown`: the text is written by an admin and needs five features; the library adds a large dependency tree to review and update for a page that does not need tables or nesting (`AGENTS.md`: no useless dependencies).

### 5. Editor: a status card and a modal with a rendered preview

`SettingsContent` gets a second card, `PrivacyPolicyCard`, with a `Badge` (`Opublikowana` or `Nieopublikowana`), an `Edytuj` (or `Napisz politykę`) button and a `Zobacz stronę` link. `Badge` and `Textarea` are added as shadcn primitives in `src/components/ui`.

`PrivacyPolicyDialog` uses `ui/dialog` and `ui/tabs`: `Podgląd` (default) renders the draft with `PolicyText` and `highlightPlaceholders`, so the admin sees exactly what visitors will see; `Edycja` shows the `Textarea` with the syntax hint and the limit. The footer of the modal has `Wczytaj szablon` and a count of unresolved placeholders on the left, `Anuluj` and `Zapisz` on the right. With no saved text, the preview is an empty state with `Zacznij od szablonu`. On phone width the dialog is full screen (`max-sm:h-dvh max-sm:max-w-none max-sm:rounded-none`) with the footer pinned.

`use-privacy-policy-editor.ts` owns the state: `draft`, `saved`, `tab`, `saving`, `status`, derived `remainingPlaceholders` and `isDirty`, and the actions `loadTemplate` (dynamic `import('@/lib/privacy/template')` on click, so the template is not in the settings bundle; `useConfirm` first when the draft has text), `save` (`updateSettingsAction({ privacyPolicy: draft })`) and `requestClose` (`useConfirm` when dirty). The initial text comes from `SettingsSection`, which still runs under `requireAdminAccess()`.

An empty draft saves `null`. Unresolved `[[…]]` placeholders are rejected by `parsePrivacyPolicy`, so a template cannot be published by accident.

### 6. Built-in template

`src/lib/privacy/template/` holds one file per group of sections (each under 200 lines) and an `index.ts` that exports `PRIVACY_POLICY_TEMPLATE`. `src/lib/privacy/placeholders.ts` holds `PLACEHOLDER_PATTERN`, `placeholder(label)` and `countPlaceholders(text)`.

The structure was checked against a long-form policy of another e-kartoteka service supplied for comparison. What it does well, and the template adopts, is: a plain-language opening and a summary before the details; saying who the controller is for each kind of reader; a separate Art. 14 source-of-data statement; an explanation for people who received an e-mail they did not expect; and rights with the practical procedure and the one-month deadline. The wording is written from scratch. The template deliberately leaves out claims that do not fit this software or that would be wrong in general (for example that cookies are mostly not personal data) and any vendor-specific statement.

Sections, in order, all in the second person:

1. `W skrócie`: who, what, why, how long, contact.
2. `Dla kogo jest ta polityka`: three readers: created the account themselves; account created by an administrator from imported data; received an e-mail they did not expect.
3. `Administrator danych i kontakt` (controller, contact, data protection officer if any).
4. Optional `Gdy tylko przetwarzamy dane na zlecenie`: operator as processor; requests go to the controller.
5. `Jakie dane przetwarzamy`: account, Google profile, apartment and billing data, technical data (account identifier, event, time); no special categories.
6. `Skąd mamy Twoje dane` (Art. 14).
7. `Po co i na jakiej podstawie`: Art. 6(1)(b), (c), (f) per purpose, with the legitimate interests named.
8. `Czy musisz podać dane`.
9. `Komu przekazujemy dane`: administrators of the application, e-mail provider, Cloudflare Turnstile, Google sign-in, `[[…]]` hosting and others, authorities.
10. `Czy dane trafiają poza EOG`: Cloudflare and Google, safeguards as a `[[…]]` to confirm.
11. `Jak długo przechowujemy dane`: `[[…]]` per category, and the automatic removal of expired verification and reset tokens.
12. `Zautomatyzowane decyzje i profilowanie`: none; account approval is manual.
13. `Twoje prawa`: Art. 15–22 and withdrawal of consent, each in one plain sentence, and the complaint to the President of the Personal Data Protection Office (`ul. Stawki 2, 00-193 Warszawa`).
14. `Jak skorzystać z praw`: channels, identification, one month (two more months for complex requests), free of charge unless manifestly unfounded or excessive.
15. `Dostałem wiadomość, której się nie spodziewałem`.
16. `Pliki cookies i podobne technologie` (Art. 399 of the Electronic Communications Law).
17. `Jak chronimy dane`: hashed passwords, roles checked on every request, single-use expiring tokens, HTTPS-only headers.
18. `Zmiany tej polityki`.

A unit test asserts the headings, that placeholders exist for controller, retention and hosting, that the cookie section cites art. 399, that the text parses with `markdown.ts` without literal-Markdown fallbacks, and that none of a list of deployment-specific names appears. The wording is a template: the operator verifies it against its real processing, and `docs/privacy-policy.md` says so.

The template describes logs as holding an account identifier, not an e-mail address, so `redact-personal-data-from-logs` is applied first.

### 7. Footer in the page flow

`src/components/layout/app-footer.tsx` (Server Component) renders `<footer>` with the version (`text-muted-foreground/60`) on the left and the policy link (`text-muted-foreground`, `hover:text-foreground hover:underline`, visible focus ring) on the right: `text-xs`, `min-h-11`, `px-4 sm:px-6`, bottom padding `env(safe-area-inset-bottom)`. The link has `min-h-11` and its own padding so its area is at least 44 px high. `src/components/privacy/privacy-link.tsx` is the shared `next/link` to `/privacy` with the text `Polityka prywatności`.

Layouts become a flex column of the full screen height with the content taking the free space, so the footer lands at the bottom of a short page and under the content of a long one:

- `AuthShell`: outer `relative flex min-h-screen flex-col overflow-hidden`, content in `relative z-10 flex flex-1 items-center justify-center p-4`, `AppFooter` last. The theme toggle stays fixed at the top.
- `DashboardLayout` and `AdminLayout`: `flex min-h-screen flex-col`, the children area `flex flex-1 flex-col`, `AppFooter` last. The fixed version label is removed.
- `Page`: `min-h-screen` becomes `flex-1`. Every use of `Page` is checked for a flex-column parent; the layouts above and the new privacy layout provide one. This also removes the extra scroll the navbar adds today.

Alternatives considered: a fixed corner (covers content while scrolling, and a bottom margin only fixes the end of the page), a link and the version in the navigation (rarely used items taking navigation space), an information sentence under the forms (breaks the rhythm of the page).

### 8. E-mail footer, documentation and specs

`EmailLayout` adds the footer link with `appUrl('/privacy')`; the plain-text generation already shows each link once. `docs/privacy-policy.md` (linked from `README.md`) explains where to edit the policy, the supported syntax, each placeholder, which sections to remove when a feature is off, and the review caveat. `openspec/config.yaml` lists the new capability. `docs/architecture.md` and `docs/code-conventions.md` are updated where they describe settings reads or layouts.

## Risks / Trade-offs

- [An old override goes stale when the app changes what it processes] → The override replaces the whole text, so the card says to review it when processing changes, and the template can be reloaded for comparison.
- [The template is published with unfilled placeholders] → `parsePrivacyPolicy` rejects text containing `[[…]]`, and the preview highlights them with a count.
- [Legal wording is wrong for a specific controller] → The template is generic, and the docs say it needs the operator's review. Nothing about a real deployment is in the repository.
- [Hand-written Markdown parser has edge cases] → The subset is documented in the editor hint, input is admin-only and rendered as React elements, so the worst case is odd formatting. Unit tests cover the subset and the unsafe-link and raw-HTML cases.
- [Changing `Page` and three layouts touches every page] → Existing page and layout tests, the visual baselines and new e2e checks (footer at the bottom of a short page, under a long one, no horizontal scroll on a phone) cover it.
- [A policy page that reads the database could be prerendered] → The section calls `await connection()`, and the build output is checked for `/privacy` being dynamic.
- [Changing `parse` and the readers touches every settings consumer] → The existing registry, query, `tenant-history` and action tests are updated in the same task.

## Migration Plan

1. Deploy the image. The migration adds the nullable column and its `CHECK`; existing rows keep `NULL`, so `/privacy` shows the not-published notice and the footer links already point to it.
2. An admin loads the template in `/admin/settings`, fills in the placeholders and saves.
3. Rollback: redeploy the previous image. The extra column is ignored by the old code and can stay.
