# Spec Delta

## MODIFIED Requirements

### Requirement: Admin User Creation

The system SHALL allow admins to create user accounts directly without the self-registration flow. The password an admin chooses SHALL be treated as temporary.

#### Scenario: Create user by admin

- **GIVEN** an authenticated admin
- **WHEN** they submit a new user's details (email, name, password, role)
- **THEN** an account is created with the specified parameters, bypassing the pending-approval flow, flagged as requiring a password change

#### Scenario: First login of an admin-created user

- **GIVEN** an account created by an admin with an admin-chosen password
- **WHEN** the user signs in for the first time
- **THEN** they are redirected to the change-password page before any other page

---

### Requirement: User Profile Self-Service

The system SHALL allow authenticated users to update their own display name and password. Whether the current password is required SHALL be decided from the account's stored `mustChangePassword` flag.

#### Scenario: Update display name

- **GIVEN** an authenticated user
- **WHEN** they submit a new name via the profile update endpoint
- **THEN** the name is updated on their account

#### Scenario: Change password

- **GIVEN** an authenticated user with a credentials-based account
- **WHEN** they submit their current password and a new password
- **THEN** the current password is verified and the new password is stored hashed

#### Scenario: Change password without current password

- **GIVEN** an authenticated user whose stored flag is not set
- **WHEN** they request a password change without providing the current password
- **THEN** the request is rejected with an appropriate error

#### Scenario: Forced password change

- **GIVEN** an authenticated user whose stored flag requires a password change
- **WHEN** they submit a new password without the current one
- **THEN** the password is updated and the flag is cleared

#### Scenario: Stale session flag

- **GIVEN** an authenticated user whose session claims a forced change but whose stored flag is clear
- **WHEN** they request a password change without the current password
- **THEN** the request is rejected; the session claim does not relax the check

#### Scenario: OAuth user cannot change password

- **GIVEN** an authenticated user who signed up via Google (no stored password)
- **WHEN** they attempt to change their password
- **THEN** the request is rejected indicating no existing password is set
