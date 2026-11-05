# Proposal

## Why

The integration specs only spot-check delivered emails (a substring or two), so a wrong subject, sender, link host or missing content would pass. The bulk account activation email is not delivered in any integration spec at all. The visual app also has Google sign-in disabled, so the login page snapshots never show the Google button users see in production.

## What Changes

- Every integration email spec asserts the delivered message as a whole: recipient, sender, subject, both bodies, no unresolved placeholders, brand and style markers, links on the app origin that also appear in the text part, and the call-to-action link.
- A new integration spec covers bulk account creation: the owner receives the activation email and signs in with the emailed login and temporary password.
- The visual app is configured with dummy Google credentials, so the login page snapshots (light, dark, desktop, phone) show the Google button, and the specs assert that the button is visible.

**Non-goals**

- No change to email content or to the Google sign-in flow; the visual app never starts OAuth.
- No new mock services.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `testing`: integration email specs assert the delivered message; the visual app shows the Google button.

## Impact

- `e2e/utils/email-assertions.ts`, `e2e/integrations/*`, `e2e/visual/public-pages.spec.ts`, login baselines, `playwright.config.ts`, `docker-compose.e2e.yaml`.
