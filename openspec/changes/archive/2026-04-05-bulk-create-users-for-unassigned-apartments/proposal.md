# Proposal: Bulk Create Users for Unassigned Apartments

## What

Add an admin tool that identifies apartments without an associated user account and allows the admin to create those accounts in bulk. The feature consists of:

1. A new admin page that lists apartments with no assigned user, grouped by HOA.
2. Selectable rows — per individual apartment or all apartments within a HOA at once.
3. A confirm action that creates a user account with a temporary password for each selected apartment owner email.
4. An activation email sent to each created user containing the temporary password and a requirement to change it on first login.

## Why

Currently, the only way for tenants to access the system is through self-registration followed by admin approval, or through individual admin user creation. When the initial dataset is imported from legacy HOA files, apartments already contain owner email addresses. Admins have no efficient way to bootstrap accounts for those owners — they must create accounts one by one. This feature eliminates that bottleneck and enables a smooth onboarding after a data import.

## Non-goals

- Sending bulk emails to already-existing users.
- Creating accounts for apartments that have no email address stored.
- Modifying the existing single-user creation flow.
- Bulk-importing users from an external file (CSV, etc.).

## Success criteria

- An admin can open the page, see all unassigned apartments that have an owner email, grouped by HOA.
- The admin can select any combination of individual apartments or entire HOA groups.
- After confirmation, one user account per unique email is created (duplicates across HOAs are deduplicated), each with `status: APPROVED`, `emailVerified: true`, and `mustChangePassword: true`.
- Each created user receives an activation email with their temporary password.
- On first login, the user is redirected to a password-change screen and cannot navigate away until they change it.
- If an email already has an account, that apartment is excluded from the selectable list.
