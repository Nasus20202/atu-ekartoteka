# Capability: Authentication

## Purpose

Handles user identity verification, session management, and account security flows including credentials-based login, Google OAuth, email verification, and password reset.

## Requirements

### Requirement: Credentials Login

The system SHALL allow users to log in with an email address and password.

#### Scenario: Successful login

- **GIVEN** a user with an approved account and a verified email
- **WHEN** they submit valid email and password credentials
- **THEN** a JWT session is created and the user is redirected to the dashboard

#### Scenario: Invalid credentials

- **GIVEN** a user exists in the system
- **WHEN** they submit an incorrect password or non-existent email
- **THEN** the system returns an authentication error without disclosing which field was wrong

#### Scenario: Turnstile validation

- **GIVEN** Cloudflare Turnstile is enabled via environment variable
- **WHEN** a login attempt is made without a valid Turnstile token
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

- **GIVEN** no user exists with the provided email
- **WHEN** a user submits a valid email, password (min 8 chars), and optional name
- **THEN** an account is created with status `PENDING`, role `TENANT`, a verification email is sent, and admins are notified

#### Scenario: First admin registration

- **GIVEN** no admin user exists in the system
- **WHEN** the setup check passes and a registration is submitted with `isFirstAdmin: true`
- **THEN** an account is created with role `ADMIN`, status `APPROVED`, `emailVerified: true`, and no notification is sent

#### Scenario: Duplicate email

- **GIVEN** a user already exists with the same email
- **WHEN** another registration is attempted with that email
- **THEN** the registration is rejected with an appropriate error

---

### Requirement: Email Verification

The system SHALL require users to verify their email address before their account can be used.

#### Scenario: Email verification flow

- **GIVEN** a new user registration (non-admin)
- **WHEN** the user clicks the verification link in their email
- **THEN** the `emailVerified` flag is set to `true` on the user account

#### Scenario: Expired verification token

- **GIVEN** a verification link that has expired (after 24 hours)
- **WHEN** the user attempts to verify with it
- **THEN** the verification is rejected and the user is prompted to request a new link

#### Scenario: Resend verification email

- **GIVEN** a user whose email is not yet verified
- **WHEN** they request a new verification email
- **THEN** a new token is generated and a fresh verification email is sent

---

### Requirement: Password Reset

The system SHALL allow users to reset a forgotten password via email.

#### Scenario: Forgot password request

- **GIVEN** a user account exists with the provided email
- **WHEN** the user submits a forgot-password request
- **THEN** a time-limited password reset link is sent to their email

#### Scenario: Reset password with valid token

- **GIVEN** a valid, unused, non-expired reset token
- **WHEN** the user submits a new password
- **THEN** the password is updated and the token is marked as used

#### Scenario: Invalid or expired reset token

- **GIVEN** a reset token that is expired or already used
- **WHEN** the user attempts to reset their password
- **THEN** the request is rejected and the user is prompted to request a new link

---

### Requirement: Session Management

The system SHALL use JWT-based sessions where the JWT stores only authorization-critical claims (`id`, `role`, `mustChangePassword`) and those claims are exposed on `session.user`.

#### Scenario: Session token refresh

- **GIVEN** an active session
- **WHEN** the session `update` trigger fires
- **THEN** the JWT is refreshed with the latest `role` and `mustChangePassword` values from the database

#### Scenario: Unauthenticated access

- **GIVEN** a user who is not signed in
- **WHEN** they attempt to access a protected route
- **THEN** they are redirected to `/login`

---

### Requirement: Forced Password Change Redirect

The system SHALL redirect users who must change their password away from all routes except the change-password page.

#### Scenario: Redirect to change-password

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to any route other than `/change-password`, `/api/user/profile`, or `/api/auth/*`
- **THEN** they are redirected to `/change-password`

#### Scenario: Allowlisted routes pass through

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to `/change-password` or call `/api/user/profile`
- **THEN** the request proceeds normally without a redirect
