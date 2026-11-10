# Design

## Context

See proposal.md for motivation. Current state that shapes the approach:

- `AppSettings` is a single row (`id = 1`) with one typed column per setting and its `CHECK`s in the migration. `src/lib/settings/registry.ts` defines each setting as `{ defaultValue, parse }`, where `parse` returns `null` for an invalid value. `getAppSettings()` reads the whole row (omitting `id` and `updatedAt`) behind a request-scoped `cache()`, and `updateAppSettings()` compares and returns the whole row. `updateSettingsAction` validates with `parseAppSettingsUpdate` and is the only settings write path.
- The tenant history window is read on tenant requests, so any large column added to the row must not be read with it.
- The proxy redirects every path except `ALLOWED_PREFIXES` for users whose token says `mustChangePassword`. Pages are public unless they call `getSession()` themselves.
- `AuthShell` (auth group layout) already renders fixed corner elements. `DashboardLayout` and `AdminLayout` render the version in the bottom-left corner. `EmailLayout` renders the footer of all five emails and `appUrl()` builds absolute URLs.
- The shadcn `Textarea` primitive is not in `src/components/ui`. No Markdown library is installed.

## Goals / Non-Goals

**Goals:**

- Keep the repository free of deployment-specific content: the policy text is data, the template describes only the software.
- No new dependency and no raw HTML anywhere in the rendering path.
- Reading one setting never loads another.

**Non-Goals:**

- Cookie banner, consent checkboxes, versioning, "last updated" date, policy history.
- Generating template sections from runtime configuration (Turnstile, Google, tracking). The operator removes what does not apply.
- Account deletion, data export, retention jobs and log redaction (separate changes).

## Decisions

### 1. Storage: nullable `privacyPolicy` column on `AppSettings`

`ALTER TABLE "AppSettings" ADD COLUMN "privacyPolicy" TEXT` with `CONSTRAINT "AppSettings_privacyPolicy_length" CHECK (char_length("privacyPolicy") <= 50000)`. `NULL` means "not configured" and the constraint passes for `NULL`. The migration is additive; existing rows get `NULL`. Prisma model: `privacyPolicy String?`.

Alternatives: a separate table (a new singleton and constraint for one field), an env var or mounted file (needs a rollout per edit, defeats the override), the registry as is (every settings read would load the text).

### 2. Registry: parse result and per-setting readers

```ts
type ParseResult<T> = { ok: true; value: T } | { ok: false; message?: string };

interface SettingDefinition<T> {
  defaultValue: T;
  parse: (value: unknown) => ParseResult<T>;
}

export const APP_SETTINGS = {
  tenantHistoryYearsBack: { defaultValue: 2, parse: parseYearsBack },
  privacyPolicy: {
    defaultValue: null as string | null,
    parse: parsePrivacyPolicy,
  },
} satisfies Record<string, SettingDefinition<unknown>>;
```

- A result object instead of `null` makes `null` a legal value and lets a failure carry a Polish message. `parseAppSettingsUpdate(body)` returns `{ ok: true; values } | { ok: false; message?: string }`; `updateSettingsAction` returns `invalid(message ?? INVALID_SETTINGS_MESSAGE)`.
- `parseYearsBack` returns the same result shape. `parsePrivacyPolicy` accepts a string, trims it, maps `''` to `null`, rejects text over `PRIVACY_POLICY_MAX_LENGTH` (50 000) and rejects text that still matches `PLACEHOLDER_PATTERN` (`/\[\[[^\]]*\]\]/`) with the message `Uzupełnij lub usuń pola oznaczone podwójnymi nawiasami kwadratowymi [[…]]`.
- One uncached helper `readSetting(key)` runs `findUnique({ where: { id: APP_SETTINGS_ROW_ID }, select: { [key]: true } })` and falls back to the key's default when the row is missing. Per-setting readers wrap it in a no-argument `cache()`: `getTenantHistoryYearsBack()` and `getPrivacyPolicy()`. A no-argument `cache()` needs no key handling and dedupes per request.
- `getAppSettings`, `readAppSettings` and `APP_SETTINGS_NON_SETTING_COLUMNS` are deleted. `updateAppSettings(values)` reads only the keys being updated for its change check, upserts, and returns only those keys (`select` built from the keys), so a history window save never reads the policy and a policy save does not return the history window.
- The action result data type becomes `Partial<AppSettingsValues>`; `useAppSettings` reads `tenantHistoryYearsBack` from it defensively.

Alternatives: a cached `getAppSettings(keys)` with a per-request `Map` keyed by the joined keys (more code and a cast for no current benefit), omitting the policy column from the full read (hides the problem, keeps the full-row API).

### 3. Page `/privacy`

`src/app/privacy/page.tsx` is a Server Component with no session check, `metadata.title = PAGE_TITLES.privacy` (`Polityka prywatności`). It renders `Page` + `PageHeader` and a `Suspense` section whose async component calls `await connection()` (request time, never prerendered), reads `getPrivacyPolicy()` and renders either `PolicyText` or the notice `Polityka prywatności nie została jeszcze opublikowana.`.

The proxy: `'/privacy'` is added to `ALLOWED_PREFIXES` so users with a forced password change can read it. `matchesPrefix` is segment-aware, so `/privacy-anything` still redirects.

### 4. Rendering a Markdown subset without a library

`src/lib/privacy/markdown.ts` parses text into blocks (`heading` with level 1–3, `paragraph`, `list` with `ordered` and items) whose inline parts are `text`, `bold` or `link`. Block rules: a blank line ends a block; `#`, `##`, `###` start a heading; `- ` or `* ` lines form a bulleted list; `1. ` lines form a numbered list; anything else is a paragraph (consecutive lines joined with a space). Inline rules: `**text**` is bold, `[text](target)` is a link when `target` is `https:`, `http:`, `mailto:` or an absolute path starting with a single `/`; any other target keeps the whole `[text](target)` as plain text. `src/components/privacy/policy-text.tsx` maps the blocks to elements with Tailwind classes. No `dangerouslySetInnerHTML` anywhere, so raw HTML is shown as text and no CSP change is needed. External links get `target="_blank"` and `rel="noopener noreferrer"`.

Why not `react-markdown`: the text is written by an admin and needs five features; the library adds a large dependency tree to review and update for a page that does not need tables or nesting (`AGENTS.md`: no useless dependencies).

### 5. Editor

A second card in `SettingsContent`: `PrivacyPolicyForm` (`src/components/settings/privacy-policy-form.tsx`) with a new shadcn `Textarea` primitive, a hint with the supported syntax and the limit, a `Wczytaj szablon` button and `Zapisz`. State, template loading and saving live in `use-privacy-policy-form.ts`, which calls `updateSettingsAction({ privacyPolicy })`. The template is loaded with a dynamic `import('@/lib/privacy/template')` on click, so it is not in the settings page bundle. If the text area has text, `useConfirm` asks before replacing it. The initial text comes from `SettingsSection` (`getPrivacyPolicy()`), which still runs under `requireAdminAccess()`.

An empty text area saves `null`. Unresolved `[[…]]` placeholders are rejected by `parsePrivacyPolicy`, so a template cannot be published by accident.

### 6. Built-in template

`src/lib/privacy/template/` holds one file per group of sections (each under 200 lines) and an `index.ts` that exports `PRIVACY_POLICY_TEMPLATE` by joining them, plus `src/lib/privacy/placeholders.ts` with `PLACEHOLDER_PATTERN` and a `placeholder(label)` helper that returns `[[label]]`. Section headings:

1. Administrator danych (controller, contact, DPO if any)
2. Zakres przetwarzanych danych (account, Google profile, imported owner and apartment data, technical data)
3. Źródło danych (art. 14: accounting system of the controller)
4. Cele i podstawy prawne (art. 6(1)(b), (c), (f); legitimate interests named)
5. Dobrowolność podania danych
6. Odbiorcy danych (administrators of the application, e-mail provider, Cloudflare, Google, `[[…]]` hosting and others, authorities)
7. Przekazywanie danych poza EOG (Cloudflare and Google, safeguards as a `[[…]]` to confirm)
8. Okres przechowywania (`[[…]]` per category; automatic removal of expired verification and reset tokens)
9. Prawa osób, których dane dotyczą (art. 15–21, withdrawal of consent where used, complaint to the President of UODO)
10. Zautomatyzowane podejmowanie decyzji (none; account approval is manual)
11. Pliki cookies i podobne technologie (art. 399 Electronic Communications Law)
12. Bezpieczeństwo danych (only measures the code enforces: hashed passwords, roles checked on every request, single-use expiring tokens, HTTPS-only transport headers)
13. Zmiany polityki prywatności

A unit test asserts the required headings, that a `[[…]]` placeholder exists for the controller, retention and hosting, and that the text contains none of a list of deployment-specific names (hosting, cloud, monitoring and analytics products). The legal wording is the operator's to verify; the `docs/` page says so.

### 7. Links and notices

A shared `PrivacyLink` component (`src/components/privacy/privacy-link.tsx`, `next/link` to `/privacy`, text `Polityka prywatności`) and a `PrivacyNotice` sentence component built on it. Placement:

- `AuthShell`: bottom-right fixed corner, mirroring the version in the bottom-left. It covers login, register, forgot password, reset password, verify e-mail and change password.
- Login and register: `PrivacyNotice` under the form. It is information, not consent: the legal basis is not consent, so there is no checkbox and nothing is blocked.
- Dashboard and admin layouts: the link next to the version.
- Profile page: a `Prywatność` card (`PrivacyCard`) with the link and one sentence about contacting the administrator named in the policy.
- `EmailLayout`: footer link using `appUrl('/privacy')`; the plain-text generation already shows each link once.

### 8. Documentation and specs

`docs/privacy-policy.md` (linked from `README.md`) explains where to edit the policy, what each placeholder means, which sections to remove when a feature is off, and that the text is a template to be checked against the operator's real processing. `openspec/config.yaml` lists the new capability. `docs/architecture.md`, `docs/code-conventions.md` and `AGENTS.md` are updated only where they describe settings access.

## Risks / Trade-offs

- [An old override goes stale when the app changes what it processes] → The override replaces the whole text, so the settings card says to review it when processing changes, and the template is reloadable for comparison.
- [The template is published with unfilled placeholders] → `parsePrivacyPolicy` rejects text containing `[[…]]`.
- [Legal wording is wrong for a specific controller] → The template is generic and the docs say it needs the operator's review; nothing about a real deployment is in the repository.
- [Hand-written Markdown parser has edge cases] → The supported subset is documented in the editor hint, input is admin-only and rendered as React elements, so the worst case is odd formatting, never script execution. Unit tests cover the subset and the unsafe-link and raw-HTML cases.
- [A policy page that reads the database could be prerendered] → The section calls `await connection()`; a test or build check confirms `/privacy` is dynamic.
- [Changing `parse` and the readers touches every settings consumer] → Behaviour is covered by the existing registry, query, `tenant-history` and action tests, updated in the same task.

## Migration Plan

1. Deploy the image. The migration adds the nullable column and its `CHECK`; existing rows keep `NULL`, so `/privacy` shows the not-published notice and the footer links already point to it.
2. An admin loads the template in `/admin/settings`, fills in the placeholders and saves.
3. Rollback: redeploy the previous image. The extra column is ignored by the old code and can stay.
