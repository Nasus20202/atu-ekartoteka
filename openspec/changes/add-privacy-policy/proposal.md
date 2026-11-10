# Proposal

## Why

The application processes personal data of tenants and owners (accounts, Google sign-in profiles, imported owner names, e-mail addresses, addresses, charges and payments) and sends it through a bot check (Cloudflare Turnstile), Google OAuth and SMTP, but it gives users no information notice. GDPR (RODO) art. 13 and 14 require the controller to inform people at the moment their data is collected, and the people imported from the association's accounting system never see any notice at all.

The app is self-hostable, so the notice text cannot be hard-coded to one controller, and the settings registry cannot currently hold a nullable, large value without every settings read loading it.

## What Changes

- Add a public `/privacy` page that renders an admin-saved policy text.
- Add an admin-editable `privacyPolicy` application setting (nullable text) on the `Ustawienia` page, with a button that loads a built-in Polish template into the editor and a button that clears the saved text.
- Ship a generic, RODO-complete Polish template in the repository. It describes only what the application itself does (accounts, imported owner data, e-mail, Turnstile, Google sign-in, cookies) and uses bracketed placeholders for everything an operator decides (controller, hosting and other recipients, retention, transfers). It is never shown to visitors.
- Link the page from every auth page, the dashboard and admin footers, the profile page and every e-mail; add a short information sentence on the login and register forms.
- Allow `/privacy` for signed-out users and for users who must change their password.
- Refactor settings access: a setting's `parse` returns a result so `null` is a valid value; each setting gets its own cached reader that selects only its column; the full-row read is removed.
- Add a `docs/` page for operators describing the placeholders and what to check.

## Non-goals

- Cookie consent banner. The only cookies are strictly necessary or user-initiated preferences; analytics is the operator's decision and is documented as such.
- Consent checkboxes. The legal basis is not consent, so registration shows an information notice, not a checkbox.
- Policy versioning, a "last updated" date, or an edit history.
- Deployment-specific content (hosting, monitoring, analytics, backups) in the repository.
- Account deletion, data export and retention jobs, and log redaction. They are separate changes.

## Capabilities

### New Capabilities

- `privacy-policy`: public policy page, admin editor and saved text, built-in template, links and information notices, safe rendering.

### Modified Capabilities

- `tenant-history-window`: settings are stored as one validated row that now includes a nullable text setting, and are read one setting at a time instead of as a whole row.
- `authentication`: `/privacy` is reachable while a password change is forced.
- `email-notifications`: every e-mail footer links to the policy.

## Impact

- Code: `prisma/schema.prisma` and one migration; `src/lib/settings/*`, `src/lib/queries/settings/*`, `src/lib/mutations/settings/*`; `src/actions/settings`; `src/components/settings`; new `src/lib/privacy/*`, `src/components/privacy/*`, `src/app/privacy`; `AuthShell`, dashboard and admin layouts, profile page, login and register pages, `EmailLayout`; `src/lib/auth/proxy-handler.ts`.
- Dependencies: none.
- Specs, `README.md`, `docs/` and `openspec/config.yaml` index updated.
- Deployment: no environment variables and no infrastructure change. A migration adds one nullable column.
