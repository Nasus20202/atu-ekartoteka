# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
