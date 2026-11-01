# Spec Delta

## ADDED Requirements

### Requirement: Admin Rights

Admin API routes and the `/admin` area SHALL require the signed-in user's role and account status as stored in the database, not the values cached in the session token.

#### Scenario: Demoted admin

- **GIVEN** a signed-in admin whose role was changed to `TENANT` in the database
- **WHEN** they call any `/api/admin/*` route or open `/admin`
- **THEN** the request is rejected with 401 and the page redirects to `/dashboard`

#### Scenario: Unapproved admin

- **GIVEN** a signed-in admin whose status is not `APPROVED`
- **WHEN** they call any `/api/admin/*` route
- **THEN** the request is rejected with 401

#### Scenario: Tenant never reaches the database check

- **GIVEN** a signed-in tenant
- **WHEN** they call any `/api/admin/*` route
- **THEN** the request is rejected with 401 without a database lookup

#### Scenario: Promoted tenant

- **GIVEN** a signed-in tenant whose role was changed to `ADMIN` in the database
- **WHEN** they call an `/api/admin/*` route
- **THEN** the request is accepted without re-authenticating

## MODIFIED Requirements

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

The system SHALL use JWT-based sessions where the JWT stores only the cached claims (`role`, `mustChangePassword`) plus the standard `sub` claim, and those values are exposed on `session.user`.

#### Scenario: Session token refresh

- **GIVEN** an active session
- **WHEN** the session `update` trigger fires
- **THEN** the JWT is refreshed with the latest `role` and `mustChangePassword` values from the database

#### Scenario: Account removed during an active session

- **GIVEN** an active session whose user row was deleted
- **WHEN** the session `update` trigger fires
- **THEN** the session is cleared and the user is signed out

#### Scenario: Session user identity

- **GIVEN** a signed-in user
- **WHEN** the session is read on the server
- **THEN** `session.user.id` equals the JWT `sub` claim and `session.user.role` is typed as `UserRole`

#### Scenario: Unauthenticated access

- **GIVEN** a user who is not signed in
- **WHEN** they attempt to access a protected route
- **THEN** they are redirected to `/login`
