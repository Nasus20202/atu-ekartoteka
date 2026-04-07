# Capability: User Management

## Purpose

Manages tenant accounts within the system, including admin approval workflows, account status transitions, apartment assignments, and user profile self-service.

## Requirements

### Requirement: Admin User Listing

The system SHALL allow admins to list all tenant users, optionally filtered by account status.

#### Scenario: List all tenants

- **GIVEN** an authenticated admin
- **WHEN** they request the user list with no filter
- **THEN** all tenant users (role `TENANT`) are returned ordered by creation date descending, each with their assigned apartments

#### Scenario: Filter by status

- **GIVEN** an authenticated admin
- **WHEN** they request the user list with a `status` query parameter (`PENDING`, `APPROVED`, or `REJECTED`)
- **THEN** only tenant users matching that status are returned

#### Scenario: Unauthorized access

- **GIVEN** a non-admin user
- **WHEN** they request the user list endpoint
- **THEN** the request is rejected with 401

---

### Requirement: Account Approval and Status Management

The system SHALL allow admins to approve, reject, or change the status of tenant accounts, and optionally assign apartments during approval.

#### Scenario: Approve user with apartment assignment

- **GIVEN** an authenticated admin and a pending tenant user
- **WHEN** the admin sets status to `APPROVED` and provides a list of apartment IDs
- **THEN** the user's status is updated to `APPROVED`, the specified apartments are assigned to the user (clearing previous assignments), and an approval notification email is sent to the tenant

#### Scenario: Approve without apartments

- **GIVEN** an authenticated admin
- **WHEN** the admin approves a user without specifying apartments
- **THEN** the user is approved and all apartment assignments are cleared

#### Scenario: Reject user

- **GIVEN** an authenticated admin
- **WHEN** the admin sets a user's status to `REJECTED`
- **THEN** the user's status is updated and all apartment assignments are cleared

#### Scenario: Apartment already assigned

- **GIVEN** a tenant user who already owns an apartment
- **WHEN** an admin tries to assign that apartment to a different user
- **THEN** the assignment is rejected with an appropriate error

#### Scenario: Re-approval notification

- **GIVEN** a user whose status is already `APPROVED`
- **WHEN** an admin updates them to `APPROVED` again (e.g., changes apartment assignment)
- **THEN** no approval notification email is sent

---

### Requirement: Admin User Creation

The system SHALL allow admins to create user accounts directly without the self-registration flow.

#### Scenario: Create user by admin

- **GIVEN** an authenticated admin
- **WHEN** they submit a new user's details (email, name, password, role)
- **THEN** an account is created with the specified parameters, bypassing the pending-approval flow

---

### Requirement: User Profile Self-Service

The system SHALL allow authenticated users to update their own display name and password.

#### Scenario: Update display name

- **GIVEN** an authenticated user
- **WHEN** they submit a new name via the profile update endpoint
- **THEN** the name is updated on their account

#### Scenario: Change password

- **GIVEN** an authenticated user with a credentials-based account
- **WHEN** they submit their current password and a new password
- **THEN** the current password is verified and the new password is stored hashed

#### Scenario: Change password without current password

- **GIVEN** an authenticated user
- **WHEN** they request a password change without providing the current password
- **THEN** the request is rejected with an appropriate error

#### Scenario: OAuth user cannot change password

- **GIVEN** an authenticated user who signed up via Google (no stored password)
- **WHEN** they attempt to change their password
- **THEN** the request is rejected indicating no existing password is set

---

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

---

### Requirement: Forced Password Change

The system SHALL force users created via bulk creation to change their temporary password before accessing any other functionality.

#### Scenario: Redirect on first login

- **GIVEN** a user with `mustChangePassword: true`
- **WHEN** they log in
- **THEN** they are redirected to `/change-password` and cannot access any other route until the password is changed

#### Scenario: Password change clears flag

- **GIVEN** a user with `mustChangePassword: true`
- **WHEN** they successfully set a new password on `/change-password`
- **THEN** `mustChangePassword` is set to `false`, the session is refreshed, and the user is redirected to the dashboard

#### Scenario: Bypass routes not blocked

- **GIVEN** a user with `mustChangePassword: true`
- **WHEN** they navigate to `/change-password` or `/api/user/profile`
- **THEN** the middleware does not redirect (allowing the password change to proceed)

---

### Requirement: New User Notifications

The system SHALL notify admins when new users register so they can take action promptly.

#### Scenario: Credentials registration notification

- **GIVEN** a new user registers via credentials
- **WHEN** registration succeeds
- **THEN** all admin users receive an email notification with the new user's email, name, and registration timestamp

#### Scenario: Google registration notification

- **GIVEN** a new user signs in via Google for the first time
- **WHEN** account creation succeeds
- **THEN** all admin users receive an email notification about the new Google-authenticated user

---

### Requirement: Full Apartment Data in Admin User Cards

The system SHALL display complete apartment details on each user card in the admin user listing.

#### Scenario: User card shows full apartment details

- **GIVEN** an authenticated admin viewing the user list
- **WHEN** a user has one or more assigned apartments
- **THEN** each apartment shows: address, building, number, postal code, city, ownership share (`shareNumerator`/`shareDenominator`), `externalOwnerId`, `externalApartmentId`, and `isActive` status

#### Scenario: Ownership share shown only when present

- **GIVEN** an apartment where `shareNumerator` or `shareDenominator` is null
- **WHEN** the admin views that user's card
- **THEN** the ownership share section is not rendered

#### Scenario: Inactive apartment shown with badge

- **GIVEN** an apartment where `isActive: false`
- **WHEN** the admin views that user's card
- **THEN** the apartment is marked with a "Nieaktywny" badge

---

### Requirement: Inactive Apartment Safeguard in Bulk Creation

The system SHALL visually disable inactive apartments in the bulk account creation picker and require explicit confirmation before including them in a creation batch.

#### Scenario: Inactive apartments rendered as disabled

- **GIVEN** an authenticated admin on the bulk account creation page
- **WHEN** the apartment list loads and includes apartments with `isActive: false`
- **THEN** those apartments are rendered with muted styling and a "Nieaktywny" badge, with the checkbox non-interactive by default

#### Scenario: Confirmation dialog on inactive apartment click

- **GIVEN** an admin clicks on a disabled inactive apartment row
- **WHEN** the click is registered
- **THEN** a confirmation dialog is shown explaining the apartment is not active in the latest import, with "Anuluj" and "Tak, utwórz konto" options

#### Scenario: Confirmed inactive apartment added to selection

- **GIVEN** the confirmation dialog is shown for an inactive apartment
- **WHEN** the admin confirms with "Tak, utwórz konto"
- **THEN** the apartment is added to the selection and treated identically to an active apartment for the remainder of the flow

#### Scenario: Cancelled confirmation leaves apartment unselected

- **GIVEN** the confirmation dialog is shown for an inactive apartment
- **WHEN** the admin cancels with "Anuluj"
- **THEN** the apartment remains unselected

#### Scenario: isActive included in unassigned apartments API response

- **GIVEN** an authenticated admin requesting unassigned apartments
- **WHEN** the API responds
- **THEN** each apartment object includes the `isActive` field

---

### Requirement: Paginated Admin User List

The system SHALL support pagination on the admin user list API.

#### Scenario: API accepts page and limit parameters

- **GIVEN** an authenticated admin
- **WHEN** they call GET /api/admin/users?page=2&limit=20
- **THEN** the response contains the users for that page and pagination metadata (total, totalPages, page, limit)

#### Scenario: Default page size

- **GIVEN** an admin requests the user list without page/limit params
- **WHEN** the API responds
- **THEN** it returns the first 20 users by default
