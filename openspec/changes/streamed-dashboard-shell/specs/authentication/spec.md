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

### Requirement: Server Action Authorization Guard

Every module that declares `'use server'` SHALL resolve the caller's identity
through a shared action guard (`requireUserAction` or `requireAdminAction`) before
reading or writing data, and SHALL return the same denial as the route guards
(unauthenticated, not allowed). A module that does neither SHALL fail linting.
Authorization SHALL come from the database, never from client-supplied arguments.

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
