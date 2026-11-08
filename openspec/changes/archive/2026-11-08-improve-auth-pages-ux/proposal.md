## Why

The authentication pages are the first screens every user sees, yet they feel
unfinished: placeholders are English sample values (`email@example.com`,
`Hasło`) instead of instructions, password fields cannot be revealed, and the
Turnstile widget and Google button pop in after a client-side config fetch,
which resizes the card under the user's cursor. The login page also mixes the
primary action, the OAuth action and the registration link in an inconsistent
order compared with the other auth screens.

## What Changes

- Replace raw sample placeholders with instructional Polish placeholders on
  every auth form (`Wprowadź adres e-mail`, `Wprowadź hasło`, etc.).
- Add a password visibility toggle (eye button) to every password field on the
  login, registration and password-reset pages, reusing one shared control.
- Reserve a fixed-height slot for the Turnstile widget and the Google button so
  the card does not resize when those widgets load, and render a skeleton while
  the public config is unknown.
- Let the browser cache the two public config responses with a short
  `Cache-Control` freshness window, so repeat visits resolve them from the HTTP
  cache instead of a network round-trip. No client-side storage is added.
- Present Turnstile as a deliberate security panel that follows the application
  theme, instead of a bare widget floating between the form and the button.
- Render a visible, deterministic fake Turnstile in the visual screenshot
  suite, so the challenge slot is part of the reviewed snapshots without
  contacting Cloudflare.
- Reorder the login secondary actions: primary submit, then the "Lub" divider
  and Google button, then the registration link. Fix the divider background so
  it matches the card, and show the same loading spinner on login as on
  registration.
- Use the animated alert for errors on all auth forms so feedback appears and
  disappears consistently.

## Non-goals

- No redesign of the auth layout, typography, branding, illustrations or the
  card composition; this is a set of targeted UX fixes on the existing design.
- No change to authentication flows, validation rules, Turnstile server
  verification, OAuth behaviour, or session handling.
- No switch to dynamic rendering for the auth routes (server-provided config was
  considered and rejected to keep the pages statically rendered).
- No new colour tokens, success palette, dependencies or database changes.
- No client-side storage for the public config: repeat-visit caching is
  delegated to the browser's HTTP cache, and a cold visit may briefly show
  skeletons.
- No redesign of the account/profile pages beyond sharing the password control
  they already use.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `authentication`: adds UI requirements for the login, registration,
  forgot-password and reset-password forms — instructional Polish placeholders,
  password visibility, a stable layout while the optional security widgets load,
  browser caching of the public config responses, and a theme-consistent
  Turnstile widget.
- `testing`: the visual app server enables dummy Turnstile credentials and the
  visual suite stubs the Cloudflare script with a visible, deterministic fake,
  so auth snapshots include the challenge slot.

## Impact

- `src/app/login/page.tsx`, `src/app/register/page.tsx`,
  `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx` — form
  markup, field placeholders, password controls, action order.
- `src/components/auth/turnstile-field.tsx`, `google-sign-in.tsx` — widget
  container, reserved slot, skeleton, theme and divider background.
- `src/components/account/password-input.tsx` — promoted to a shared form
  control with full input props (autocomplete, required, disabled, minLength,
  aria attributes), consumed by the auth forms and the profile form.
- `src/components/auth/use-google-sign-in-enabled.ts` — returns `null` while the
  config is loading so the login page can reserve the OAuth slot;
  `src/hooks/use-turnstile-config.ts` already distinguishes loading from
  disabled and is unchanged.
- `src/app/api/config/turnstile/route.ts`, `src/app/api/config/google/route.ts`
  — add browser `Cache-Control` headers; response bodies, auth and env reads
  stay the same.
- Unit tests next to the touched pages, components, hooks and config routes;
  Playwright visual snapshots for the login, registration and forgot-password
  pages in light/dark, desktop/mobile, with a stubbed visible Turnstile.
- `playwright.config.ts` and `e2e/utils/mock-server.ts` — visual server Turnstile
  credentials and the fake widget used by the visual suite.
- Public config payloads and dependencies are unchanged. The only environment
  change is dummy Turnstile credentials on the visual E2E server.
