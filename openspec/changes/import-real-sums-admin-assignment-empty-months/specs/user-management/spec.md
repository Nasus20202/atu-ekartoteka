## ADDED Requirements

### Requirement: Admin Users Filter on User Listing

The system SHALL provide a "Administratorzy" filter on the admin user listing page that returns users with `role = ADMIN`. Selecting the filter SHALL replace the active status filter and SHALL list admin users regardless of account status.

#### Scenario: Filter button visible on user listing

- **GIVEN** an authenticated admin on `/admin/users`
- **WHEN** the page loads
- **THEN** a filter button labelled "Administratorzy" is rendered after "Odrzucone" in the filter row

#### Scenario: Selecting the admin filter loads admin users

- **GIVEN** an authenticated admin on `/admin/users`
- **WHEN** the admin clicks the "Administratorzy" filter button
- **THEN** the page reloads the listing via `GET /api/admin/users?role=ADMIN&page=1`
- **AND** only users with `role = ADMIN` are displayed
- **AND** users of all account statuses (PENDING, APPROVED, REJECTED) are included

#### Scenario: Switching back to a status filter restores tenant listing

- **GIVEN** the "Administratorzy" filter is active
- **WHEN** the admin clicks any of `Wszyscy / Oczekujące / Zatwierdzone / Odrzucone`
- **THEN** the listing reloads without the `role=ADMIN` parameter and shows tenant users matching that status (or all tenants for `Wszyscy`)

#### Scenario: Pagination resets when switching filters

- **GIVEN** the admin is on page 2 of any filter
- **WHEN** the admin switches to or from the "Administratorzy" filter
- **THEN** the page index resets to 1

### Requirement: Admin Users Assignable Apartments via Per-User Flow

The system SHALL allow admins to assign apartments to admin users (`role = ADMIN`) using the existing per-user apartment assignment UI on the user listing page. The assignment flow, validation, and persistence behaviour SHALL be identical to the tenant flow, except that no apartment-assignment notification email is sent to admin assignees.

#### Scenario: Assign apartments to an admin user

- **GIVEN** an authenticated admin viewing an admin user card under the "Administratorzy" filter
- **WHEN** they select one or more unassigned apartments and confirm
- **THEN** the apartments' `userId` is set to the admin user's ID
- **AND** the response and listing reflect the new assignment immediately

#### Scenario: No assignment email sent for admin assignees

- **GIVEN** apartments are assigned to a user with `role = ADMIN`
- **WHEN** the assignment completes
- **THEN** no apartment-assignment / approval email is sent to that admin user

#### Scenario: Apartment uniqueness enforced for admin assignments

- **GIVEN** an apartment already assigned to any user (tenant or admin)
- **WHEN** an admin attempts to assign that apartment to a different admin user
- **THEN** the assignment is rejected with the same error used for tenant assignment conflicts

## MODIFIED Requirements

### Requirement: Admin User Listing

The system SHALL allow admins to list users, optionally filtered by account status or by role. By default (no role parameter) the listing SHALL include only `TENANT` users, preserving the existing contract for callers that do not specify a role.

#### Scenario: List all tenants

- **GIVEN** an authenticated admin
- **WHEN** they request the user list with no filter
- **THEN** all tenant users (role `TENANT`) are returned ordered by creation date descending, each with their assigned apartments

#### Scenario: Filter by status

- **GIVEN** an authenticated admin
- **WHEN** they request the user list with a `status` query parameter (`PENDING`, `APPROVED`, or `REJECTED`)
- **THEN** only tenant users matching that status are returned

#### Scenario: Filter by role = ADMIN

- **GIVEN** an authenticated admin
- **WHEN** they request the user list with `role=ADMIN`
- **THEN** only users with `role = ADMIN` are returned, ordered by creation date descending, each with their assigned apartments
- **AND** users of all account statuses are included
- **AND** the `status` query parameter, if also supplied, is ignored

#### Scenario: Unauthorized access

- **GIVEN** a non-admin user
- **WHEN** they request the user list endpoint
- **THEN** the request is rejected with 401
