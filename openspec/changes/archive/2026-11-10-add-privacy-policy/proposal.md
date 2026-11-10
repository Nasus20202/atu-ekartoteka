# Proposal

## Why

The application processes personal data of tenants and owners (accounts, Google sign-in profiles, imported owner names, e-mail addresses, addresses, charges and payments) and sends it through a bot check (Cloudflare Turnstile), Google OAuth and SMTP, but it gives users no information notice. GDPR (RODO) art. 13 and 14 require the controller to inform people when their data is collected, and the owners imported from the association's accounting system, who never register, never see any notice at all.

The app is self-hostable, so the notice cannot be hard-coded to one controller. The built-in text must therefore be a strong, generic starting point, and the settings registry cannot currently hold a large nullable value without every settings read loading it.

## What Changes

- Add a public `/privacy` page that renders an admin-saved policy text.
- Add an admin-editable `privacyPolicy` application setting (nullable text). A card on the `Ustawienia` page shows its status; editing happens in a modal that opens on a rendered preview and switches to a text editor.
- Ship a generic, complete Polish template that the editor can load. It describes only what the application does and is written for three kinds of readers: people with an account, owners imported by an administrator who never registered, and people who received an e-mail they did not expect. It uses `[[…]]` placeholders for everything the operator decides. It is never shown to visitors, and saving is blocked while a placeholder remains.
- Add one footer to every page group (auth pages, tenant panel, admin panel, the policy page): the version on the left, a `Polityka prywatności` link on the right. It sits under the content, or at the bottom of the screen when the content is short, and never covers anything.
- Add the link to the footer of every e-mail.
- Allow `/privacy` for signed-out users and for users who must change their password.
- Refactor settings access: a setting's `parse` returns a result so `null` is a valid value; each setting gets its own cached reader that selects only its column; the full-row read is removed.
- Add a `docs/` page for operators describing the placeholders and what to check.

## Non-goals

- A cookie consent banner. The application sets only strictly necessary cookies and a user-initiated preference; analytics is an operator decision documented in the template.
- Consent checkboxes or an information sentence under the forms. The legal basis is not consent, and the footer link is visible on every page where data is collected.
- Policy versioning, a "last updated" date or an edit history.
- Deployment-specific content (hosting, monitoring, analytics, backups) in the repository.
- Account deletion, data export and retention jobs. Reviewing what the application writes to logs and traces is a separate change, `redact-personal-data-from-logs`, delivered in the same pull request and applied first, because the template describes the result.

## Capabilities

### New Capabilities

- `privacy-policy`: public policy page, admin editor and saved text, built-in template, footer and links, safe rendering.

### Modified Capabilities

- `tenant-history-window`: settings are stored as one validated row that now includes a nullable text setting, and are read one setting at a time instead of as a whole row.
- `authentication`: `/privacy` is reachable while a password change is forced.
- `email-notifications`: every e-mail footer links to the policy.

## Impact

- Code: `prisma/schema.prisma` and one migration; `src/lib/settings/*`, `src/lib/queries/settings/*`, `src/lib/mutations/settings/*`; `src/actions/settings`; `src/components/settings`; new `src/lib/privacy/*`, `src/components/privacy/*`, `src/components/layout/app-footer.tsx`, `src/app/privacy`; `AuthShell`, the dashboard and admin layouts, `Page`, `EmailLayout`; `src/lib/auth/proxy-handler.ts`.
- Visual baselines for every page that gains a footer.
- Dependencies: none.
- Specs, `README.md`, `docs/` and `openspec/config.yaml` index updated.
- Deployment: no environment variables and no infrastructure change. A migration adds one nullable column.
