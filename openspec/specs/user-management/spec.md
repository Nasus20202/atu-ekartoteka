# Capability: User Management

## Purpose

Manages tenant accounts within the system, including admin approval workflows, account status transitions, apartment assignments, and user profile self-service.

## Requirements

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

---

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

### Requirement: Admin Users Assignable Apartments via Per-User Flow

The system SHALL allow admins to assign apartments to admin users (`role = ADMIN`) using the existing per-user apartment assignment UI on the user listing page. The assignment flow, validation, and persistence behaviour SHALL be identical to the tenant flow, except that no apartment-assignment notification email is sent to admin assignees.

#### Scenario: Assign apartments to an admin user

- **GIVEN** an authenticated admin viewing an admin user card under the `Administratorzy` filter
- **WHEN** they select one or more unassigned apartments and confirm
- **THEN** the apartments' `userId` is set to the admin user's ID
- **AND** the response and listing reflect the new assignment immediately

#### Scenario: No assignment email sent for admin assignees

- **GIVEN** apartments are assigned to a user with `role = ADMIN`
- **WHEN** the assignment completes
- **THEN** no apartment-assignment or approval email is sent to that admin user

#### Scenario: Apartment uniqueness enforced for admin assignments

- **GIVEN** an apartment already assigned to any user, tenant or admin
- **WHEN** an admin attempts to assign that apartment to a different admin user
- **THEN** the assignment is rejected with the same error used for tenant assignment conflicts

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
- **WHEN** they press "Zaproś użytkowników" and confirm both steps of the dialog
- **THEN** one account per unique email is created with `role: TENANT`, `status: APPROVED`, `emailVerified: true`, `mustChangePassword: true`, all matching apartments are assigned, and an activation email with a temporary password is sent to each new user

#### Scenario: Invite button label

- **GIVEN** an authenticated admin on the "create" tab with apartments selected
- **WHEN** the submit button is shown
- **THEN** it reads "Zaproś użytkowników" and shows "Zapraszanie..." while the request runs

#### Scenario: Invitation needs two confirmations

- **GIVEN** an admin presses "Zaproś użytkowników" on the "create" tab
- **WHEN** the first step of the dialog is shown
- **THEN** the step lists every account to be created, with its email, owner and apartments
- **AND** no request is sent until the admin presses "Dalej" and then "Zaproś użytkowników" in the second step

#### Scenario: Back or cancel sends nothing

- **GIVEN** the admin is on the second step of the invitation dialog
- **WHEN** they press "Wstecz", or close the dialog
- **THEN** no request is sent
- **AND** "Wstecz" returns to the account list

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
- **THEN** it returns the first 50 users by default
- **AND** a `limit` above 200 is capped at 200

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

### Requirement: Compact User Table

In the table view of the admin users page, users SHALL be shown as table rows under the headers `Użytkownik`, `E-mail`, `Status`, `Mieszkania` and `Akcje`. Each row SHALL show the name (or email when there is no name), the email, the status badge, the number of assigned apartments and the same `Akcje` menu as the card for that status. Registration date and the assigned apartment details SHALL NOT be shown in the table.

#### Scenario: Table content

- **GIVEN** the table view
- **WHEN** an approved user `Anna Nowak` (`anna@example.com`) with 2 assigned apartments is shown
- **THEN** their row shows `Anna Nowak`, `anna@example.com`, the `Zatwierdzony` badge and `2 mieszkania`

#### Scenario: Pending user actions

- **GIVEN** a pending user row
- **WHEN** the admin opens its `Akcje` menu
- **THEN** `Zatwierdź` and `Odrzuć` are offered and behave exactly as on the card

#### Scenario: Approved and rejected user actions

- **GIVEN** an approved or rejected user row
- **WHEN** the admin opens its `Akcje` menu
- **THEN** approved users offer `Mieszkania (N)` and `Zmień status`, and rejected users offer `Zmień status`, behaving exactly as on the card

#### Scenario: Action refreshes the table

- **GIVEN** the table view under the `Oczekujące` filter
- **WHEN** the admin approves a user from its row menu
- **THEN** the loaded pages refresh in place and the user leaves the table, as in cards view

#### Scenario: Infinite scrolling appends table rows

- **GIVEN** the table view is selected and more users remain
- **WHEN** the admin scrolls to the end of the list
- **THEN** the next page is appended as table rows

### Requirement: User Table Sorting

The user table SHALL sort by `Użytkownik`, `E-mail`, `Status` and `Mieszkania` from the column headers, with the sort column and direction sent to the users API so every page arrives in that order. Names SHALL fall back to the email and use locale-aware order, status SHALL use the order `Oczekuje`, `Zatwierdzony`, `Odrzucony` and the apartment count SHALL sort numerically.

#### Scenario: Sort by name

- **GIVEN** users `Zed` and `Anna Nowak`
- **WHEN** the admin sorts by `Użytkownik` ascending
- **THEN** `Anna Nowak` comes first

#### Scenario: Sort users without a name

- **GIVEN** a user without a name
- **WHEN** the admin sorts by `Użytkownik`
- **THEN** the user is ordered by their email

#### Scenario: Sort by apartment count

- **GIVEN** users with 2 and 10 assigned apartments
- **WHEN** the admin sorts by `Mieszkania` ascending
- **THEN** the user with 2 apartments comes first

#### Scenario: Sort by status

- **GIVEN** pending, approved and rejected users
- **WHEN** the admin sorts by `Status` ascending
- **THEN** pending users come first, then approved, then rejected

### Requirement: Database-Filtered Admin User Data

The apartment assignment dialog SHALL list only apartments the database reports as free or held by the edited user, filtered by the dialog search on the server. The pending-accounts header on the users page SHALL show the number of pending tenant accounts counted by the database, independent of the loaded rows and the active filter.

#### Scenario: Apartment held by another user is not offered

- **GIVEN** more than 200 users, one of them holding apartment `A1`
- **WHEN** an admin opens the assignment dialog for a different user
- **THEN** `A1` is not listed

#### Scenario: Dialog search by full label

- **WHEN** the admin types `ul. Testowa 1/2B` in the dialog search
- **THEN** the apartment with address `ul. Testowa`, building `1` and number `2B` is listed

#### Scenario: Pending count with another filter

- **GIVEN** 3 pending tenant accounts
- **WHEN** the admin shows the `Zatwierdzone` filter
- **THEN** the header still reads `3 konta oczekują na zatwierdzenie`
