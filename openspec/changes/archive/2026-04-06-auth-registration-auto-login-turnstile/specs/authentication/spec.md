## MODIFIED Requirements

### Requirement: User Registration

The system SHALL allow new users to self-register with email and password, and SHALL automatically authenticate them after successful registration.

#### Scenario: Standard tenant registration with auto-login

- **GIVEN** no user exists with the provided email
- **WHEN** a user submits a valid email, password (min 8 chars), and optional name
- **THEN** an account is created with status `PENDING`, role `TENANT`, a verification email is sent, admins are notified, and the user is automatically signed in and redirected to the dashboard

#### Scenario: First admin registration with auto-login

- **GIVEN** no admin user exists in the system
- **WHEN** setup check passes and registration is submitted with `isFirstAdmin: true`
- **THEN** an account is created with role `ADMIN`, status `APPROVED`, `emailVerified: true`, no admin notification is sent, and the user is automatically signed in and redirected to the dashboard

### Requirement: Credentials Login

The system SHALL enforce Turnstile validation for credentials login when enabled, while allowing secure post-registration auto-login without reusing consumed Turnstile tokens.

#### Scenario: Post-registration login bypass with Turnstile enabled

- **GIVEN** Cloudflare Turnstile is enabled and registration already passed Turnstile validation
- **WHEN** immediate post-registration credentials sign-in is attempted using a valid short-lived signed bypass token
- **THEN** login succeeds without requiring a second Turnstile token, and standard credentials checks still apply

#### Scenario: Invalid bypass token fallback

- **GIVEN** Cloudflare Turnstile is enabled and a credentials login request contains an invalid or missing bypass token
- **WHEN** login is processed
- **THEN** normal Turnstile token validation is required and login is rejected without a valid Turnstile token
