## ADDED Requirements

### Requirement: Protected Content Waits For The Access Check

Protected pages SHALL render their content only after the session and the
database access check succeeded. While the check runs, the page MAY show a
loading skeleton but SHALL NOT render protected content or its data. A failed
check SHALL redirect to `/login` (no session) or `/dashboard` (not allowed).

#### Scenario: Slow access check

- **WHEN** an admin opens an admin page and the access check is slow
- **THEN** the navbar and a page skeleton are shown and no admin content is rendered

#### Scenario: Non-admin

- **GIVEN** an approved tenant
- **WHEN** they open an admin page
- **THEN** no admin content is rendered and they are redirected to the dashboard

#### Scenario: Deleted account

- **GIVEN** a valid session whose user no longer exists
- **WHEN** the dashboard loads
- **THEN** the user is signed out without a redirect loop
