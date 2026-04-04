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
