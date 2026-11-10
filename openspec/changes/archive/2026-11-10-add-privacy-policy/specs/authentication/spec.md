# Spec Delta

## MODIFIED Requirements

### Requirement: Forced Password Change Redirect

The system SHALL redirect users who must change their password away from all routes except the change-password page and the privacy policy page. The `mustChangePassword` value in the token SHALL be only a redirect hint: any decision that grants something because the flag is set SHALL read it from the database.

#### Scenario: Redirect to change-password

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to any route other than `/change-password`, `/privacy` or `/api/auth/*`
- **THEN** they are redirected to `/change-password`

#### Scenario: Allowlisted routes pass through

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to `/change-password` or `/privacy`, or submit the profile Server Action from the change-password page
- **THEN** the request proceeds normally without a redirect

#### Scenario: Privacy path matches whole segments

- **GIVEN** an authenticated user with `mustChangePassword: true`
- **WHEN** they navigate to `/privacy-anything`
- **THEN** they are redirected to `/change-password`

#### Scenario: Stale token does not relax the password check

- **GIVEN** a user whose token says `mustChangePassword: true` but whose database row says `false`
- **WHEN** they submit a new password without the current one
- **THEN** the request is rejected because the current password is required

#### Scenario: Leaving the change-password page

- **GIVEN** a user on `/change-password` who has just saved a new password
- **WHEN** the request succeeds
- **THEN** the session is refreshed from the database through the auth session endpoint and the user is taken to `/dashboard` by client-side navigation, without a Server Action
