# Spec Delta

## MODIFIED Requirements

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
- **WHEN** they navigate to any route other than `/change-password`, `/api/user/profile`, or `/api/auth/*`
- **THEN** they are redirected to `/change-password`

#### Scenario: Allowlisted routes pass through

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to `/change-password` or call `/api/user/profile`
- **THEN** the request proceeds normally without a redirect

#### Scenario: Stale token does not relax the password check

- **GIVEN** a user whose token says `mustChangePassword: true` but whose database row says `false`
- **WHEN** they submit a new password without the current one
- **THEN** the request is rejected because the current password is required

#### Scenario: Leaving the change-password page

- **GIVEN** a user on `/change-password` who has just saved a new password
- **WHEN** the request succeeds
- **THEN** the session is refreshed from the database through the auth session endpoint and the user is taken to `/dashboard` by client-side navigation, without a Server Action
