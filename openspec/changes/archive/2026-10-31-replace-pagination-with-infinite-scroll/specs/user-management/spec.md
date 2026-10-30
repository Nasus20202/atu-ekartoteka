# Spec Delta

## ADDED Requirements

### Requirement: Admin User List Infinite Scroll

The admin user list page (`/admin/users`) SHALL load users with infinite scrolling as defined by the infinite scrolling requirements in `visual-design`, ordered by creation date descending. After an admin action that changes a user (approve, reject, assign apartments, change status, create user), the list SHALL refresh every already-loaded page in place rather than returning to the top.

#### Scenario: Scrolling loads further users

- **GIVEN** more tenant users match the active filter than fit on one API page
- **WHEN** the admin scrolls to the end of the user list
- **THEN** the next users are appended in creation-date-descending order without duplicates

#### Scenario: Search restarts the list

- **GIVEN** the admin has loaded several pages of users
- **WHEN** they type into the search box and the debounce elapses
- **THEN** the list restarts with the first matching users

#### Scenario: Action keeps loaded range

- **GIVEN** the admin has loaded three pages under the `Oczekujące` filter
- **WHEN** they approve a user from the third page
- **THEN** the three loaded pages are re-fetched and the approved user disappears from the list
- **AND** the remaining users stay loaded and the scroll position is not reset to the top

## MODIFIED Requirements

### Requirement: Admin Users Filter on User Listing

The system SHALL provide an `Administratorzy` filter on the admin user listing page that returns users with `role = ADMIN`. Selecting the filter SHALL replace the active status filter and SHALL list admin users regardless of account status.

#### Scenario: Filter button visible on user listing

- **GIVEN** an authenticated admin on `/admin/users`
- **WHEN** the page loads
- **THEN** a filter button labelled `Administratorzy` is rendered after `Odrzucone` in the filter row

#### Scenario: Selecting the admin filter loads admin users

- **GIVEN** an authenticated admin on `/admin/users`
- **WHEN** the admin clicks the `Administratorzy` filter button
- **THEN** the page reloads the listing via `GET /api/admin/users?role=ADMIN&page=1`
- **AND** only users with `role = ADMIN` are displayed
- **AND** users of all account statuses are included

#### Scenario: Switching back to a status filter restores tenant listing

- **GIVEN** the `Administratorzy` filter is active
- **WHEN** the admin clicks any of `Wszyscy`, `Oczekujące`, `Zatwierdzone`, or `Odrzucone`
- **THEN** the listing reloads without the `role=ADMIN` parameter and shows tenant users matching that status, or all tenants for `Wszyscy`

#### Scenario: Pagination resets when switching filters

- **GIVEN** the admin has scrolled past the first page of any filter
- **WHEN** the admin switches to or from the `Administratorzy` filter
- **THEN** the previously loaded users are discarded and only the first page of the new filter is shown

### Requirement: Bulk User Creation

The system SHALL allow admins to create multiple tenant accounts at once for apartments that have no assigned user but have an email address on file, AND SHALL allow admins to assign existing user accounts to unassigned apartments in bulk using the email stored on each apartment.

#### Scenario: View unassigned apartments (creatable mode)

- **GIVEN** an authenticated admin
- **WHEN** they request the unassigned apartments list (default or `mode=creatable`)
- **THEN** the apartments with `userId IS NULL` and a non-empty email that does NOT match any existing user are returned, one page of HOAs at a time, grouped by HOA, sorted by HOA name then building then number

#### Scenario: View apartments assignable to existing users

- **GIVEN** an authenticated admin
- **WHEN** they request the unassigned apartments list with `mode=assignable`
- **THEN** the apartments with `userId IS NULL` and an email that matches an existing user account are returned, one page of HOAs at a time, grouped by HOA, sorted by HOA name then building then number

#### Scenario: Load more HOAs

- **GIVEN** the list has more HOAs than the first page
- **WHEN** the admin scrolls to the end of the HOA list (or activates the `Pokaż więcej` fallback button)
- **THEN** the next page of HOAs is appended to the list automatically and the selection is kept

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

### Requirement: Paginated Admin User List

The system SHALL support pagination on the admin user list API.

#### Scenario: API accepts page and limit parameters

- **GIVEN** an authenticated admin
- **WHEN** they call GET /api/admin/users?page=2&limit=20
- **THEN** the response contains the users for that page and pagination metadata (total, totalPages, page, limit)

#### Scenario: Default page size

- **GIVEN** an admin requests the user list without page/limit params
- **WHEN** the API responds
- **THEN** it returns the first 50 users by default
- **AND** a `limit` above 200 is capped at 200
