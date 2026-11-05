## Why

The five HTML email templates each repeat the same document shell, card wrapper, footer, call-to-action button and fallback link, with every style written inline by hand. A look-and-feel tweak means editing five files in lockstep, variables are substituted by string replacement, and nothing is type-checked.

## What Changes

- Build the HTML emails as React components with React Email (`@react-email/components`): one shared layout, a shared action button and details box, and one small component per email.
- Define the email styles once in a theme module mirroring the website's design tokens (primary, foreground, muted, border, radius, fonts), so emails and site cannot drift apart silently.
- Render HTML through React Email; escaping of recipient-controlled values comes from React instead of hand-written replacement.
- Message builders become asynchronous because rendering is asynchronous.
- Plain-text bodies stay as the existing `.txt` templates with `{{VARIABLE}}` placeholders; the rendered look and the text bodies are unchanged.
- Delete the five HTML template files and the HTML branch of the template loader.

## Capabilities

### New Capabilities

### Modified Capabilities

- `email-notifications`: the "Email Templates" requirement describes React-component HTML emails, the shared theme and the unchanged plain-text fallback.

## Impact

- New dependency `@react-email/components` (pinned).
- `src/lib/email/`: new components, theme and email modules; `template-loader.ts` serves only plain text; `email-messages.ts` and `email-service.ts` become async.
- Tests: template, text-body, delivery and visual email tests adapt to async builders and must otherwise pass unchanged, with no baseline updates.
