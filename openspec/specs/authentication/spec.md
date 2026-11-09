# Capability: Authentication

## Purpose

Handles user identity verification, session management, and account security flows including credentials-based login, Google OAuth, email verification, and password reset.

## Requirements

### Requirement: Credentials Login

The system SHALL allow existing users to log in with an email address and
password. Account status and email verification SHALL NOT block login; they
control which tenant data the session may read and are surfaced as UI hints.

#### Scenario: Successful login

- **GIVEN** an existing account with a password
- **WHEN** they submit valid email and password credentials
- **THEN** a JWT session is created and the user is redirected to the dashboard

#### Scenario: Invalid credentials

- **GIVEN** a user exists in the system
- **WHEN** they submit an incorrect password or non-existent email
- **THEN** the system returns an authentication error without disclosing which field was wrong and performs the same bcrypt work in both cases

#### Scenario: Unapproved account

- **GIVEN** a signed-in user whose status is `PENDING` or `REJECTED`
- **WHEN** they open a tenant data page
- **THEN** the page hides tenant data and shows the account status instead of refusing the session

#### Scenario: Unverified email

- **GIVEN** a signed-in user whose email is not verified
- **WHEN** they open the dashboard
- **THEN** a dismissible verification banner is shown and the session remains valid

#### Scenario: Turnstile validation

- **GIVEN** Cloudflare Turnstile is enabled via environment variable
- **WHEN** a login attempt is made without a valid Turnstile token and without a registration autologin grant
- **THEN** the login is rejected before any credential check

---

### Requirement: Google OAuth Login

The system SHALL allow users to sign in with their Google account.

#### Scenario: First-time Google login

- **GIVEN** no user exists with the Google account's email
- **WHEN** a user completes the Google OAuth flow
- **THEN** a new user account is created with `emailVerified: true`, status `PENDING`, role `TENANT`, and admins are notified

#### Scenario: Returning Google user

- **GIVEN** a user already exists with the same email (credentials or Google)
- **WHEN** they complete the Google OAuth flow
- **THEN** they are signed into the existing account

---

### Requirement: User Registration

The system SHALL allow new users to self-register with email and password.

#### Scenario: Standard tenant registration

- **GIVEN** no user exists with the normalised provided email
- **WHEN** a user submits a valid email, password (min 8 chars), and optional name
- **THEN** an account is created with status `PENDING`, role `TENANT`, a verification email is sent, admins are notified, the user is automatically signed in, and a short-lived auto-login token is returned

#### Scenario: First admin registration

- **GIVEN** no admin user exists in the system
- **WHEN** the setup check passes and a registration is submitted with `isFirstAdmin: true`
- **THEN** an account is created with role `ADMIN`, status `APPROVED`, `emailVerified: true`, no notification is sent, and the user is automatically signed in

#### Scenario: Concurrent first-admin registration

- **GIVEN** no admin user exists
- **WHEN** two requests submit `isFirstAdmin: true` at the same time
- **THEN** at most one admin is created and the other request is rejected with the existing "administrator already exists" message

#### Scenario: Duplicate email

- **GIVEN** a user already exists with the same email in any casing
- **WHEN** another registration is attempted with that email
- **THEN** the registration is rejected with the "email already exists" error rather than a server error

---

### Requirement: Email Verification

The system SHALL email a verification link to a new account and SHALL surface
the unverified state as a dismissible UI hint. Email verification SHALL NOT gate
login.

#### Scenario: Email verification flow

- **GIVEN** a new user registration (non-admin)
- **WHEN** the user follows the verification link in their email
- **THEN** the `emailVerified` flag is set to `true` on the user account and the banner disappears

#### Scenario: Expired verification token

- **GIVEN** a verification link that has expired (after 24 hours)
- **WHEN** the user attempts to verify with it
- **THEN** the verification is rejected and the user is prompted to request a new link

#### Scenario: Resend verification email

- **GIVEN** a user whose email is not yet verified
- **WHEN** they request a new verification email
- **THEN** a new token is generated and a fresh verification email is sent

#### Scenario: Unverified user signs in

- **GIVEN** an account with an unverified email
- **WHEN** the user signs in with valid credentials
- **THEN** the session is created and the verification banner is available

---

### Requirement: Password Reset

The system SHALL allow users to reset a forgotten password via email. A reset token SHALL be single-use, and a token consumed by one request SHALL NOT be usable to change the password a second time.

#### Scenario: Forgot password request

- **GIVEN** a user account exists with the provided email
- **WHEN** the user submits a forgot-password request
- **THEN** a time-limited password reset link is sent to their email

#### Scenario: Reset password with valid token

- **GIVEN** a valid, unused, non-expired reset token
- **WHEN** the user submits a new password
- **THEN** the password is updated and the token is marked as used in the same transaction

#### Scenario: Concurrent use of the same token

- **GIVEN** a reset token that another request already consumed
- **WHEN** the user submits a new password with it
- **THEN** the password is not changed and the request is rejected

#### Scenario: Invalid or expired reset token

- **GIVEN** a reset token that is expired or already used
- **WHEN** the user attempts to reset their password
- **THEN** the request is rejected and the user is prompted to request a new link

---

### Requirement: Session Management

The system SHALL use JWT-based sessions where the JWT stores only the standard
`sub` claim plus `mustChangePassword`, and those values are exposed on
`session.user`. The JWT SHALL NOT carry a role or any other permission claim;
authorization is always resolved from the database.

#### Scenario: Session token refresh

- **GIVEN** an active session
- **WHEN** the session `update` trigger fires
- **THEN** the JWT is refreshed with the latest `mustChangePassword` value from the database

#### Scenario: Account removed during an active session

- **GIVEN** an active session whose user row was deleted
- **WHEN** the session `update` trigger fires
- **THEN** the session is cleared and the user is signed out

#### Scenario: Orphaned session on a protected page

- **GIVEN** a signed-in user whose user row was deleted and whose JWT has not expired
- **WHEN** they open a dashboard page
- **THEN** no page content is shown, the session is cleared and they land on `/login` without a full page reload

#### Scenario: Session user identity

- **GIVEN** a signed-in user
- **WHEN** the session is read on the server
- **THEN** `session.user.id` equals the JWT `sub` claim, `session.user.mustChangePassword` is present, and no role claim is exposed

#### Scenario: No permission claim in the token

- **GIVEN** a signed-in admin
- **WHEN** the JWT is decoded
- **THEN** it contains no `role` claim and admin rights are resolved from the database on each check

#### Scenario: Unauthenticated access

- **GIVEN** a user who is not signed in
- **WHEN** they attempt to access a protected route
- **THEN** they are redirected to `/login`

#### Scenario: Logout without a page reload

- **GIVEN** a signed-in user
- **WHEN** they click the logout button
- **THEN** the session is cleared, they are taken to `/login` by client-side navigation without a full page reload, and the button is disabled while the request is in flight

#### Scenario: Logout failure

- **GIVEN** a signed-in user whose sign-out request fails
- **WHEN** they click the logout button
- **THEN** they stay on the current page and the button becomes usable again

### Requirement: Forced Password Change Redirect

The system SHALL redirect users who must change their password away from all routes except the change-password page. The `mustChangePassword` value in the token SHALL be only a redirect hint: any decision that grants something because the flag is set SHALL read it from the database.

#### Scenario: Redirect to change-password

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to any route other than `/change-password` or `/api/auth/*`
- **THEN** they are redirected to `/change-password`

#### Scenario: Allowlisted routes pass through

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to `/change-password` or submit the profile Server Action from that page
- **THEN** the request proceeds normally without a redirect

#### Scenario: Stale token does not relax the password check

- **GIVEN** a user whose token says `mustChangePassword: true` but whose database row says `false`
- **WHEN** they submit a new password without the current one
- **THEN** the request is rejected because the current password is required

#### Scenario: Leaving the change-password page

- **GIVEN** a user on `/change-password` who has just saved a new password
- **WHEN** the request succeeds
- **THEN** the session is refreshed from the database through the auth session endpoint and the user is taken to `/dashboard` by client-side navigation, without a Server Action

### Requirement: Admin Rights

Admin API routes and the `/admin` area SHALL require the signed-in user's role
and account status as stored in the database, not the values cached in the
session token. An authenticated user without admin rights SHALL receive `403`;
an anonymous request SHALL receive `401`.

#### Scenario: Demoted admin

- **GIVEN** a signed-in admin whose role was changed to `TENANT` in the database
- **WHEN** they call any `/api/admin/*` route or open `/admin`
- **THEN** the request is rejected with 403 and the page redirects to `/dashboard`

#### Scenario: Unapproved admin

- **GIVEN** a signed-in admin whose status is not `APPROVED`
- **WHEN** they call any `/api/admin/*` route
- **THEN** the request is rejected with 403

#### Scenario: Tenant is rejected after the database check

- **GIVEN** a signed-in tenant
- **WHEN** they call any `/api/admin/*` route
- **THEN** the role is resolved from the database and the request is rejected with 403 before any admin data is queried

#### Scenario: Anonymous request

- **GIVEN** a request without a session
- **WHEN** it calls any `/api/admin/*` route
- **THEN** the request is rejected with 401

#### Scenario: Promoted tenant

- **GIVEN** a signed-in tenant whose role was changed to `ADMIN` in the database
- **WHEN** they call an `/api/admin/*` route
- **THEN** the request is accepted without re-authenticating

### Requirement: Email Identity

The system SHALL treat an email address as a single identity regardless of case
or surrounding whitespace: writes store the normalised form (trimmed and
lowercased), the migration that backfills existing rows refuses to run when two
addresses would collapse into one, and reads compare the normalised form
exactly.

#### Scenario: Mixed-case registration

- **GIVEN** no account exists for `jan@example.com`
- **WHEN** a user registers as `Jan@Example.com `
- **THEN** the stored address is `jan@example.com` and a second registration for
  any casing of the same address is rejected as a duplicate

#### Scenario: Sign-in with different casing

- **GIVEN** an account stored as `jan@example.com`
- **WHEN** the user submits `JAN@example.com` and the correct password
- **THEN** the login succeeds

#### Scenario: Password reset for a legacy mixed-case account

- **GIVEN** an account created before normalisation whose address contains
  uppercase letters
- **WHEN** the user requests a password reset with the same address in any
  casing
- **THEN** the reset email is sent to the stored address

---

### Requirement: Registration Auto-Login Grant

The post-registration Turnstile bypass SHALL be a stateless, short-lived token
bound to the registered email. The token SHALL be refused after it expires or
when it is presented for a different address.

#### Scenario: Valid token

- **GIVEN** a freshly registered account with a valid auto-login token
- **WHEN** the client signs in with the correct password within the token's
  lifetime
- **THEN** the login succeeds without a Turnstile token

#### Scenario: Wrong password

- **GIVEN** a valid auto-login token
- **WHEN** the client submits it with an incorrect password
- **THEN** the login is rejected

#### Scenario: Expired token

- **GIVEN** an auto-login token older than its lifetime
- **WHEN** it is presented
- **THEN** the login requires a Turnstile token

#### Scenario: Email mismatch

- **GIVEN** a valid auto-login token issued for one address
- **WHEN** it is presented for a different address
- **THEN** the login requires a Turnstile token

---

### Requirement: API Route Authentication Guard

Every API route module SHALL either resolve the caller's identity through a
shared auth guard (`requireUser` or `requireAdmin`) or be listed as a public
route. A module that does neither SHALL fail linting.

#### Scenario: New protected route

- **GIVEN** a new `src/app/api/**/route.ts` module
- **WHEN** it imports none of the auth guards
- **THEN** `pnpm lint` fails and names the module

#### Scenario: Public route

- **GIVEN** a public module such as `/api/health/route.ts` that carries a file-level `eslint-disable local/require-api-auth-guard` comment with a stated reason
- **WHEN** it is linted
- **THEN** no guard is required

---

### Requirement: Google Account Linking

The system SHALL link a Google sign-in to an existing account by email only when
Google marks the address as verified. A profile explicitly flagged as unverified
SHALL be refused.

#### Scenario: Unverified Google profile

- **GIVEN** a Google profile whose `email_verified` claim is `false`
- **WHEN** the user completes the OAuth flow
- **THEN** the sign-in is refused and no account is created or linked

---

### Requirement: Protected Content Waits For The Access Check

Protected pages SHALL render their content only after the session and the
database access check succeeded. While the check runs, the page MAY show a
loading skeleton but SHALL NOT render protected content or its data. A failed
check SHALL redirect to `/login` (no session) or `/dashboard` (not allowed).
Admin pages run the check in their own `page.tsx` before rendering any content.

#### Scenario: Slow access check

- **WHEN** an admin opens an admin page and the access check is slow
- **THEN** the navbar is shown, the page renders nothing else until the check completes, and no admin content is rendered

#### Scenario: Non-admin

- **GIVEN** an approved tenant
- **WHEN** they open an admin page
- **THEN** no admin content is rendered and they are redirected to the dashboard

#### Scenario: Deleted account

- **GIVEN** a valid session whose user no longer exists
- **WHEN** the dashboard loads
- **THEN** the user is signed out without a redirect loop

### Requirement: Server Action Authorization Guard

Every module that declares `'use server'` SHALL resolve the caller's identity through a shared action guard (`requireUserAction` or `requireAdminAction`) before reading or writing data, and SHALL return the same denial as the route guards (unauthenticated, not allowed). A module that does neither SHALL fail linting, unless it carries a file-level `eslint-disable local/require-action-auth-guard` comment with a stated reason.

#### Scenario: Public authentication action

- **GIVEN** a signed-out visitor registers, verifies an email or resets a password
- **WHEN** the Server Action runs
- **THEN** it runs without a session, applies the same validation and Turnstile check as before, and returns the same Polish messages on failure

#### Scenario: Unguarded module without a reason

- **GIVEN** a `'use server'` module has no action guard and no disable comment
- **WHEN** linting runs
- **THEN** the lint rule fails the module

#### Scenario: Anonymous call

- **WHEN** an anonymous client invokes an action
- **THEN** it is denied as unauthenticated and no data is read or written

#### Scenario: Non-admin calls an admin action

- **GIVEN** an approved tenant
- **WHEN** they invoke an admin action
- **THEN** it is denied as not allowed and nothing changes

#### Scenario: New action module without a guard

- **GIVEN** a new `'use server'` module
- **WHEN** it imports neither guard
- **THEN** `pnpm lint` fails and names the module

### Requirement: Public Server Actions Limited to Signed-Out Flows

A `'use server'` module that skips the action guard with a stated reason SHALL be limited to signed-out flows (registration, email verification, password reset), protected by server-side Turnstile checks where enabled.

#### Scenario: Signed-out flow module may skip the guard

- **GIVEN** a registration action module with the file-level disable comment and a stated reason
- **WHEN** a signed-out visitor submits the form
- **THEN** the action runs without a session and the Turnstile token is verified on the server where Turnstile is enabled

#### Scenario: Signed-in feature may not skip the guard

- **GIVEN** a `'use server'` module that changes a signed-in user's data
- **WHEN** it carries the disable comment instead of an action guard
- **THEN** it does not meet the requirement, because only signed-out flows may skip the guard

### Requirement: Action Authorization Read From the Database

Authorization in Server Actions SHALL come from the database, never from client-supplied arguments.

#### Scenario: Client-supplied role ignored

- **GIVEN** an approved tenant who invokes an admin action with an argument claiming an admin role
- **WHEN** the action runs
- **THEN** the caller's role is read from the database and the action is denied as not allowed

### Requirement: Provider Endpoint Overrides

The system SHALL allow the Cloudflare Turnstile verification endpoint and the Google OpenID issuer to be overridden by environment variables for local and test environments, defaulting to the real endpoints.

#### Scenario: Defaults

- **GIVEN** `TURNSTILE_VERIFY_URL` and `GOOGLE_ISSUER_URL` are unset
- **WHEN** a Turnstile token is verified or a Google sign-in starts
- **THEN** the Cloudflare siteverify endpoint and Google's own endpoints are used

#### Scenario: Turnstile override

- **GIVEN** `TURNSTILE_VERIFY_URL` is set
- **WHEN** a token is verified
- **THEN** the secret and token are posted to that URL and the result is handled exactly as for Cloudflare, failing closed on any error

#### Scenario: Google override

- **GIVEN** `GOOGLE_ISSUER_URL` is set
- **WHEN** a user signs in with Google
- **THEN** the OIDC flow uses that issuer's discovery document, and account creation and linking behave as for the real provider

### Requirement: Instructional Auth Form Placeholders

Every input on the login, registration, forgot-password and reset-password
pages SHALL show a Polish placeholder that tells the user what to enter.
Placeholders SHALL NOT repeat a sample value such as `email@example.com` and
SHALL NOT replace the visible label.

#### Scenario: Email placeholder

- **GIVEN** the login, registration or forgot-password page
- **WHEN** the page is rendered
- **THEN** the email input shows the placeholder `Wprowadź adres e-mail`

#### Scenario: Password placeholders

- **GIVEN** any auth page with a password field
- **WHEN** the page is rendered
- **THEN** the initial password field shows `Wprowadź hasło` (or
  `Wprowadź nowe hasło` on the reset page), and the confirmation field shows
  `Powtórz hasło` (or `Powtórz nowe hasło` on the reset page)

#### Scenario: Labels remain the field names

- **GIVEN** any auth input with a placeholder
- **WHEN** the placeholder is shown
- **THEN** the visible label remains rendered and associated with the input, so
  the field has an accessible name even after the user types

### Requirement: Password Visibility Toggle

Every password field on the auth pages SHALL provide a control that switches
the field between masked and visible text. The control SHALL be a button that
does not submit the form, SHALL be reachable by keyboard, and SHALL be named
`Pokaż hasło` while the value is masked and `Ukryj hasło` while it is visible.
The control SHALL cover the full height of the field at its trailing edge, so a
tap anywhere in that area toggles the value instead of focusing the input.

#### Scenario: Password is masked by default

- **GIVEN** an auth page with a password field
- **WHEN** the page renders
- **THEN** the field type is `password` and the toggle is named `Pokaż hasło`

#### Scenario: Reveal and re-hide the password

- **GIVEN** a password field containing a value
- **WHEN** the user activates the visibility toggle twice
- **THEN** the first activation shows the value as text and names the toggle
  `Ukryj hasło`, and the second activation masks it again

#### Scenario: Toggle does not submit the form

- **GIVEN** a filled auth form
- **WHEN** the user activates a password visibility toggle
- **THEN** no authentication request is sent

#### Scenario: Password fields toggle independently

- **GIVEN** the registration or reset form with two password fields
- **WHEN** the user reveals the first field
- **THEN** only the first field becomes visible and the second stays masked

#### Scenario: Tap near the trailing edge reveals the password

- **GIVEN** an auth page with a password field
- **WHEN** the user taps just inside the field's right edge
- **THEN** the visibility toggle is activated, the field shows the value as text,
  and the input does not receive focus

### Requirement: Stable Auth Card While Widgets Load

The auth card SHALL reserve the vertical space needed by the Turnstile widget
and the Google sign-in option before their configuration is known, so loading
them SHALL NOT resize the card or move the form controls the user is about to
interact with. A placeholder SHALL occupy the reserved space while the
configuration is loading; an option that resolves as disabled SHALL collapse
only after the configuration resolves.

#### Scenario: Configuration is slow to load

- **GIVEN** the public Turnstile and Google configuration has not resolved yet
- **WHEN** an auth page renders
- **THEN** each widget area shows a placeholder with the same height as the
  final widget, and the card height does not change when the configuration
  arrives

#### Scenario: A widget is disabled

- **GIVEN** the resolved configuration reports Turnstile or Google as disabled
- **WHEN** the page settles
- **THEN** that option is removed from the card and no empty reserved gap is
  left behind

#### Scenario: Repeat visit uses the browser cache

- **GIVEN** a successful config response that is still fresh in the browser's
  HTTP cache
- **WHEN** the user reloads an auth page
- **THEN** the config request is served from the browser cache without a
  network round-trip and the widgets appear without waiting for the server

### Requirement: Public Auth Configuration Caching

The public Turnstile and Google config endpoints SHALL allow the browser to
cache successful responses with a short freshness window measured in minutes.
Cached entries SHALL contain only public values (site key and enabled flags),
and a response older than the freshness window SHALL be revalidated so a
changed Turnstile or Google configuration is picked up.

#### Scenario: Cacheable response

- **GIVEN** either public config endpoint receives a request
- **WHEN** it responds with the config
- **THEN** the response carries a `Cache-Control` header that allows public
  caching with a non-zero `max-age`

#### Scenario: Fresh response is reused

- **GIVEN** a config response that is still inside its freshness window
- **WHEN** an auth page requests the same endpoint
- **THEN** the browser serves the cached response without contacting the server

#### Scenario: Stale response is revalidated

- **GIVEN** a cached config response older than its freshness window
- **WHEN** an auth page requests the endpoint again
- **THEN** the browser fetches the current response and the page reflects the
  current enabled state

#### Scenario: Payload stays public

- **GIVEN** any cached config response
- **WHEN** it is inspected
- **THEN** it contains only the public site key and enabled flags, never the
  Turnstile secret key or Google client secret

### Requirement: Turnstile Widget Presentation

The Turnstile widget SHALL read as part of the auth form: it SHALL span the same
width as the form controls, SHALL follow the active light or dark application
theme, and SHALL sit in a reserved slot that keeps its height while the
challenge is pending, solved or reset. The widget SHALL NOT render when
Turnstile is disabled or no site key is configured.

#### Scenario: Widget matches the form width

- **GIVEN** an enabled Turnstile configuration
- **WHEN** the widget renders on desktop or mobile
- **THEN** it spans the width of the form controls and does not overflow the
  card

#### Scenario: Widget on a narrow phone

- **GIVEN** a form column narrower than the widget's minimum width
- **WHEN** the widget renders
- **THEN** it is scaled down to the width of the form controls with its
  proportions kept, and the reserved slot shrinks to the scaled height

#### Scenario: Widget follows the active theme

- **GIVEN** the application is in dark mode
- **WHEN** the Turnstile widget renders
- **THEN** the widget uses its dark appearance, and in light mode it uses its
  light appearance

#### Scenario: Disabled Turnstile

- **GIVEN** Turnstile is disabled or the site key is missing
- **WHEN** an auth page renders
- **THEN** no Turnstile widget and no empty captcha slot are shown

#### Scenario: Height is stable across challenge states

- **GIVEN** a rendered Turnstile widget
- **WHEN** the challenge moves from pending to solved or is reset after a failed
  submit
- **THEN** the form does not change height

### Requirement: Auth Page Action Order

The login page SHALL present its actions in this order: primary submit, then the
OAuth sign-in option separated by the `Lub` divider, then the registration link.
Other auth pages SHALL keep their primary submit before any return link. The
divider label SHALL be painted on the card background so the line does not show
through it.

#### Scenario: Login action order

- **GIVEN** the login page with Google sign-in enabled
- **WHEN** the page is rendered
- **THEN** the `Zaloguj się` button comes before the `Lub` divider and the
  Google button, and the registration link comes last

#### Scenario: Login without Google

- **GIVEN** the login page with Google sign-in disabled
- **WHEN** the page is rendered
- **THEN** neither the `Lub` divider nor the Google button is shown, and the
  registration link immediately follows the submit button

### Requirement: Consistent Auth Form Feedback

Every auth form SHALL surface a failed submission as an alert with `role`
`alert`, a Polish message, and destructive styling, and the alert SHALL animate
in and out. While a request is in flight the submit button SHALL show a loading
indicator and the form controls SHALL be disabled.

#### Scenario: Failed login shows an alert

- **GIVEN** the login form with invalid credentials
- **WHEN** the user submits it
- **THEN** a destructive alert with `role` `alert` shows the credentials error
  and the form remains usable

#### Scenario: Loading feedback

- **GIVEN** any auth form
- **WHEN** the user submits it and the request is in flight
- **THEN** the submit button shows a spinner and a loading label, and the
  controls cannot be submitted again

#### Scenario: Error alert animates

- **GIVEN** an auth form showing an error alert
- **WHEN** the error is cleared
- **THEN** the alert animates out instead of disappearing abruptly
