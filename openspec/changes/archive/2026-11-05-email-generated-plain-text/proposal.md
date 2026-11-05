## Why

Every email had a hand-written plain-text template next to its React component, so each wording or link change had to be made twice and the two versions could drift apart.

## What Changes

- Generate the plain-text part of every email from the rendered HTML with React Email's plain-text conversion, tuned so headings keep their case, detail labels sit on their own line, the brand header and the "copy this address" fallback are left out and each link appears once.
- Delete the five `.txt` templates, the template loader and its tests.
- Plain-text bodies change wording slightly (for example the signature line and link layout); the exact-text snapshots are regenerated.

## Capabilities

### New Capabilities

### Modified Capabilities

- `email-notifications`: the "Email Templates" requirement states that the plain-text part is derived from the HTML instead of separate templates.

## Impact

- `src/lib/email/email-messages.tsx`; removed `template-loader.ts` and `templates/`.
- Unit snapshots of the text bodies and the activation e2e spec's password extraction.
