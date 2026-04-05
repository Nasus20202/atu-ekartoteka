## MODIFIED Requirements

### Requirement: Bulk User Creation

The system SHALL allow admins to create multiple tenant accounts at once for apartments that have no assigned user but have an email address on file, AND SHALL allow admins to assign existing user accounts to unassigned apartments in bulk using the email stored on each apartment.

#### Scenario: View unassigned apartments (creatable mode)

- **GIVEN** an authenticated admin
- **WHEN** they request the unassigned apartments list (default or `mode=creatable`)
- **THEN** all apartments with `userId IS NULL` and a non-empty email that does NOT match any existing user are returned, grouped by HOA, sorted by HOA name then building then number

#### Scenario: View apartments assignable to existing users

- **GIVEN** an authenticated admin
- **WHEN** they request the unassigned apartments list with `mode=assignable`
- **THEN** all apartments with `userId IS NULL` and an email that matches an existing user account are returned, grouped by HOA, sorted by HOA name then building then number

#### Scenario: Bulk create accounts

- **GIVEN** an authenticated admin selects one or more unassigned apartments in the "create" tab
- **WHEN** they confirm the bulk creation
- **THEN** one account per unique email is created with `role: TENANT`, `status: APPROVED`, `emailVerified: true`, `mustChangePassword: true`, all matching apartments are assigned, and an activation email with a temporary password is sent to each new user

#### Scenario: Email deduplication on create

- **GIVEN** two selected apartments share the same email address in the create-new flow
- **WHEN** the bulk create is processed
- **THEN** only one account is created and both apartments are assigned to it

#### Scenario: Existing email skipped on create

- **GIVEN** a selected apartment whose email already corresponds to an existing user
- **WHEN** the bulk create is processed
- **THEN** no new account is created for that email; the result includes it in the `skipped` count

#### Scenario: Bulk assign existing users to apartments

- **GIVEN** an authenticated admin selects one or more apartments in the "assign existing" tab
- **WHEN** they confirm the bulk assignment
- **THEN** each selected apartment's email is matched to an existing user and `apartment.userId` is set to that user's ID within a transaction; the response contains `{ assigned, skipped, errors }`

#### Scenario: Email deduplication on assign

- **GIVEN** two selected apartments share the same email in the assign-existing flow
- **WHEN** the bulk assign is processed
- **THEN** both apartments are assigned to the single matching user

#### Scenario: Apartment already assigned at submit time

- **GIVEN** an apartment was assigned by another operation between page load and submission
- **WHEN** the bulk assign is processed
- **THEN** that apartment is skipped and counted in `skipped`; other valid apartments are still processed

#### Scenario: Unauthorized bulk create or assign

- **GIVEN** a non-admin user
- **WHEN** they call any of the bulk-create, bulk-assign, or unassigned-apartments endpoints
- **THEN** the request is rejected with 401
