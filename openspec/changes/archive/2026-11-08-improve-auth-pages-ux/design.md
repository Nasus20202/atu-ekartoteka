# Design

## Context

See `proposal.md` — Why.

Current state that shapes the approach:

- The auth pages under `src/app/{login,register,forgot-password,reset-password}`
  are client components wrapped in the server `AuthLayout`
  (`src/components/layout/auth-layout.tsx`). They are statically prerendered:
  no server code on these routes reads runtime environment variables.
- Turnstile and Google availability are loaded on the client through two SWR
  hooks that call public config routes:
  - `GET /api/config/turnstile` → `{ "siteKey": string | null, "enabled": boolean }`
  - `GET /api/config/google` → `{ "enabled": boolean }`
    Both routes call `connection()` so runtime env is not frozen at build time.
    Shapes and routes are unchanged by this design.
- `useTurnstileConfig` returns `null` while loading and a disabled config on
  failure; `useGoogleSignInEnabled` returns `false` both while loading and when
  disabled, so the login page cannot tell "unknown" from "off".
- `TurnstileField` renders the Cloudflare widget only after the config arrives
  and adds no reserved height. `GoogleSignIn` is conditionally rendered after
  its config arrives. Together they cause the card resize reported by users.
- SWR's default cache already deduplicates and shares these config responses
  for the lifetime of the page session; no browser persistence is added.
- Both config routes are anonymous and return only public data, so their
  responses are safe to cache in the browser with a short `Cache-Control`
  freshness window; this is the only caching layer added by this design.
- `PasswordInput` already exists at
  `src/components/account/password-input.tsx` (eye toggle, Polish aria-label),
  but it lives in the account feature, supports only `id`, `placeholder`,
  `value` and `onChange`, and is used only by the profile form.
- Feedback patterns in the codebase: `AnimatedAlert` for errors that animate
  in/out, `Skeleton` for loading placeholders, `Loader2` spinners inside
  `Button`.

## Goals / Non-Goals

**Goals:**

- Keep the auth routes statically rendered while removing the layout shift
  caused by the optional widgets.
- One shared password control used by the auth pages and the profile form, with
  full native input attributes (autocomplete, required, disabled, minLength,
  aria wiring).
- A cold load may show a skeleton for one config round-trip, but the card must
  never resize when the widget arrives. Repeat visits resolve the config from
  the browser's HTTP cache.
- Preserve the existing auth card composition, colours and typography.

**Non-Goals:**

- No server-side config injection and no `connection()` removal in auth layouts.
- No client-side storage (no `localStorage`, no JS cache provider): repeat-visit
  caching is handled by HTTP `Cache-Control` only.
- No new dependency, API route, environment variable, database field or
  migration.
- No new design tokens; success/warning colours keep their existing palette.
- No changes to Turnstile verification, OAuth, session or password rules.

## Decisions

### D1. Reserved slots + skeleton instead of server-rendered config

Keep the hooks client-side and give the optional widgets a fixed footprint:

- Turnstile: the field renders a skeleton with the widget's height while the
  config is unknown, the widget itself once enabled, and nothing once the config
  reports disabled.
- Google: the hook becomes tri-state (`true | false | null`). `null` renders a
  divider+button skeleton of the same height, `true` renders the current
  `GoogleSignIn`, `false` renders nothing.

Alternatives considered:

- **Server-provided config** (read env in a server layout): removes the shift
  completely but requires `connection()` and makes the auth routes dynamic. The
  user chose to keep them static, so it is rejected.
- **Persistent client cache** (`localStorage` or an SWR cache provider): would
  remove the cold-load skeleton, but the login page is opened rarely and the
  reserved slot already removes the visible jump. Repeat visits are covered by
  the HTTP cache in D2 without any client code. Rejected.

### D2. Browser caching for the public config routes

Set the header in each route response rather than adding a cache layer in the
client:

```ts
const CACHE_CONTROL_HEADER = 'public, max-age=300';

return NextResponse.json(body, {
  headers: { 'Cache-Control': CACHE_CONTROL_HEADER },
});
```

- Applies to `GET /api/config/turnstile` and `GET /api/config/google`.
- `public` is safe: the response depends only on server env, is identical for
  every anonymous visitor and contains no secrets or user data.
- `max-age=300` keeps repeat visits within five minutes instant while bounding
  the window in which a Turnstile/Google toggle can be missed. A stale
  "disabled" entry is the risky direction, so the window stays short rather
  than a day.
- `connection()` stays in both routes; it makes the handler dynamic, which does
  not prevent sending `Cache-Control`. Route tests assert the header is present
  on the response, and the e2e suite checks it over the real server so a
  framework override would be caught.
- SWR still revalidates on mount; a fresh HTTP cache entry makes that request
  resolve without a network round-trip, and an expired one fetches fresh data.

Alternatives considered:

- **Client-side `localStorage` cache or SWR cache provider**: gives the same
  repeat-visit speed but adds hydration guards, TTL/shape validation and
  provider wiring. The browser already has an HTTP cache keyed by URL, so the
  client code is unnecessary.
- **Long `max-age` (hours or a day)**: best repeat-load hit rate, but an admin
  disabling or enabling Turnstile would leave some users with the old state for
  that whole period. Five minutes is the safer default.
- **No caching**: every mount pays a config round-trip even though the values
  almost never change. Rejected.

### D3. Promote `PasswordInput` to a generic UI control

Move `src/components/account/password-input.tsx` to
`src/components/ui/password-input.tsx` and widen its props:

```ts
interface PasswordInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'onChange'
> {
  onChange: (value: string) => void;
}
```

- Keeps the existing `onChange(value)` contract, so the profile form only
  changes its import.
- Passes `autoComplete`, `required`, `disabled`, `minLength`,
  `aria-describedby` and the rest through to `Input`.
- Input gets `pr-10`; the toggle is a `type="button"` icon button with
  `aria-label` `Pokaż hasło` / `Ukryj hasło`, a focus-visible ring and
  `text-muted-foreground hover:text-foreground`.

Alternative: keep it in `account/` and import across features (breaks the
feature boundary) or duplicate it in `auth/` (two controls to maintain).
Rejected.

### D4. Turnstile presentation

`TurnstileField` renders:

```tsx
<div className="flex min-h-[65px] w-full items-center justify-center">
  <Turnstile
    ref={ref}
    siteKey={config.siteKey}
    options={{ theme: 'auto', size: 'flexible', language: 'pl' }}
    ...
  />
</div>
```

- `size: 'flexible'` makes the widget span the form width like the inputs.
- `theme: 'auto'` follows the active light/dark theme.
- `language: 'pl'` matches the UI language.
- `min-h-[65px]` matches the flexible widget height and is declared once as a
  named constant next to the component.
- The same slot class is used by the loading skeleton, so pending → solved or a
  reset after a failed submit does not change the card height.

Fallback: if the flexible size is unsupported on an old browser, Cloudflare
falls back to its normal widget; the centered slot still keeps the height.

### D5. Login page ordering and feedback

- Order: `TurnstileField` → submit → `Lub` divider → Google → register link.
  Remove the current placement of the register link between submit and OAuth.
- The divider label uses `bg-card` instead of `bg-background` so the line does
  not show through inside the card.
- Login gets the same loading state as registration: `Loader2` spinner,
  `Logowanie...` label and a disabled button while `loading || isPending`.
- All auth forms switch to `AnimatedAlert` for destructive errors, matching the
  existing login behaviour.

### D6. Placeholders

| Page            | Field            | Placeholder                |
| --------------- | ---------------- | -------------------------- |
| login           | email            | `Wprowadź adres e-mail`    |
| login           | password         | `Wprowadź hasło`           |
| register        | name             | `Wprowadź imię i nazwisko` |
| register        | email            | `Wprowadź adres e-mail`    |
| register        | password         | `Wprowadź hasło`           |
| register        | confirm password | `Powtórz hasło`            |
| forgot-password | email            | `Wprowadź adres e-mail`    |
| reset-password  | new password     | `Wprowadź nowe hasło`      |
| reset-password  | confirm password | `Powtórz nowe hasło`       |

Placeholders live in one module (`src/lib/auth/form-placeholders.ts`) so the
auth pages and their tests use the same strings; labels are unchanged.

### D7. Visible fake Turnstile in visual tests

The visual app server now has dummy Turnstile credentials
(`TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`), so the challenge slot exists in
the snapshots instead of being absent. To keep the snapshots deterministic and
offline, `stubVisibleTurnstileWidget(page)` intercepts the Cloudflare `api.js`
request and serves the small fake widget kept in
`e2e/utils/fake-turnstile-widget.js`:

- It renders a fixed 65px panel with a checkbox, `Weryfikacja` and a
  `CLOUDFLARE` mark, using its own light/dark palette derived from
  `options.theme`, the `dark` class or `prefers-color-scheme`.
- It never solves itself, so the submit button stays in the pending state and
  no token or network response affects the image.
- It exposes `data-fake-turnstile="visible"`, which the visual spec waits for
  before taking a screenshot.
- The real widget is still what production renders; only the visual project
  stubs the script, and the functional suite continues to stub or disable
  Turnstile as before.

## Risks / Trade-offs

- **Cold load shows a skeleton for one config round-trip** → Accepted: the
  reserved slot prevents any card resize, and a repeat visit inside the
  five-minute window is served from the browser cache.
- **A widget that resolves as disabled collapses its skeleton** → Only happens
  when Turnstile or Google is turned off, which is not the deployed
  configuration; the collapse occurs once per cold load.
- **A toggle can be missed for up to five minutes** → The `max-age=300` window
  bounds it; the risky case is a cached "disabled" config while the server has
  just enabled a widget, which resolves on the next load after expiry.
- **A framework layer could override `Cache-Control`** → A route test asserts
  the header on the handler response and the e2e suite checks it against the
  real server.
- **`size: 'flexible'` changes the widget footprint** → Covered by the Playwright
  visual snapshots at 1280 px and 390 px; if the widget cannot span the width,
  it is centered in the same slot.
- **Moving `PasswordInput` touches profile tests** → Import-only change for the
  profile form; existing tests continue to assert the eye toggle behaviour.
- **Visual snapshots change** → All four auth snapshots are regenerated
  intentionally and reviewed in the same task as the markup change.
- **The fake widget can drift from the real Cloudflare widget** → It exists only
  to make the slot visible and stable in visual tests; the real widget stays in
  production and functional tests still exercise the real integration contract.

## Migration Plan

No database, API shape, environment or storage changes, so no migration is
required. Deploy normally; rollback is a revert of the change. After changing a
Turnstile or Google environment setting, browsers may serve the previous config
for up to five minutes.

## Open Questions

None.
