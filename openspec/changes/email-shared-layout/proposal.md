## Why

The five HTML email templates each repeat the same document shell, card wrapper, footer, call-to-action button and fallback link, with every style written inline. A look-and-feel tweak means editing five files in lockstep and the copies can drift apart.

## What Changes

- Extract the shared document shell, card and footer into one layout template.
- Move the shared styles into one stylesheet of named classes; the loader inlines them into `style` attributes when templates are loaded, so delivered emails still carry inline styles only.
- Add reusable partials, starting with the call-to-action button plus its "copy this address" fallback, included from the template bodies.
- Reduce each HTML template to its own content (heading, copy, variables); plain-text templates and rendered email appearance are unchanged.

## Capabilities

### New Capabilities

### Modified Capabilities

- `email-notifications`: the "Email Templates" requirement describes how HTML templates are composed from a shared layout, stylesheet and partials at load time.

## Impact

- `src/lib/email/template-loader.ts` and new helpers beside it; `src/lib/email/templates/` (layout, stylesheet, partials, slimmed bodies).
- Unit tests for composition and inlining; existing template, text-body, integration and visual email tests must pass unchanged.
- No new dependencies, no change to the variables or messages the application passes in.
