## ADDED Requirements

### Requirement: View apartments assignable to existing users

The system SHALL expose an endpoint that returns unassigned apartments whose email address matches an existing user account, grouped by HOA.

#### Scenario: Fetch assignable apartments as admin

- **WHEN** an admin calls `GET /api/admin/unassigned-apartments?mode=assignable`
- **THEN** the system returns apartments where `userId IS NULL` and the apartment's email exists in the users table, grouped by HOA and sorted by HOA name → building → number

#### Scenario: Default mode returns only creatable apartments

- **WHEN** an admin calls `GET /api/admin/unassigned-apartments` (no `mode` param, or `mode=creatable`)
- **THEN** the system returns apartments where `userId IS NULL` and the apartment's email does NOT exist in the users table (existing behaviour, unchanged)

#### Scenario: Non-admin access is rejected

- **WHEN** a non-admin calls `GET /api/admin/unassigned-apartments?mode=assignable`
- **THEN** the system responds with HTTP 401

---

### Requirement: Bulk assign existing users to apartments

The system SHALL allow admins to assign existing user accounts to multiple unassigned apartments at once, matching by the email stored on each apartment.

#### Scenario: Successful bulk assign

- **WHEN** an admin submits `POST /api/admin/users/bulk-assign` with `{ apartmentIds: ["id1", "id2"] }` and all selected apartments are still unassigned with matching existing users
- **THEN** the system sets `apartment.userId` for each apartment to the matched user's ID within a transaction and returns `{ assigned: N, skipped: 0, errors: 0 }`

#### Scenario: Deduplication — two apartments share the same email

- **WHEN** two apartments in the request share the same email and that email matches one existing user
- **THEN** the system assigns both apartments to that single user and counts each apartment assignment separately in `assigned`

#### Scenario: Apartment already assigned (race condition)

- **WHEN** an apartment was assigned between the admin loading the page and submitting the request
- **THEN** the system skips that apartment and increments `skipped`; other valid apartments are still processed

#### Scenario: No matching user found for an apartment's email

- **WHEN** an apartment's email no longer matches any existing user at submission time
- **THEN** the system skips that apartment and increments `skipped`

#### Scenario: Non-admin bulk assign is rejected

- **WHEN** a non-admin calls `POST /api/admin/users/bulk-assign`
- **THEN** the system responds with HTTP 401

---

### Requirement: Bulk-create page mode switcher

The system SHALL present the bulk-create admin page with two tabs: one for creating new accounts and one for assigning existing accounts.

#### Scenario: Admin switches to "assign existing" tab

- **WHEN** an admin navigates to `/admin/users/bulk-create` and clicks the "Przypisz istniejące" tab
- **THEN** the page loads apartments that are assignable to existing users and shows them grouped by HOA with per-apartment checkboxes

#### Scenario: Submit assign-existing selection

- **WHEN** an admin selects one or more apartments in the "assign existing" tab and clicks the submit button
- **THEN** the page calls `POST /api/admin/users/bulk-assign` and displays a success alert with the number of assigned and skipped apartments

#### Scenario: Empty state — no assignable apartments

- **WHEN** the admin switches to the "assign existing" tab and there are no apartments whose email matches an existing user
- **THEN** the page displays a message indicating no apartments are available for assignment in this mode
