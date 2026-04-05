## Why

During bulk account creation, admins sometimes need to assign an existing tenant account to an apartment rather than creating a new one. Currently, the bulk-create flow only creates new accounts and silently skips apartments whose email already has a registered user — there is no way to link that existing user to the apartment.

## What Changes

- The bulk-create UI gains a second mode: "assign existing accounts" — admins can select unassigned apartments whose email matches an existing user and assign that user without creating a new account.
- The current mode (create new accounts for unassigned apartments without any user) remains unchanged.
- The two modes are surfaced as two distinct actions / tabs on the bulk-create page.
- A new API endpoint (or extended existing one) handles the assignment-only path: given a list of apartment IDs, it looks up the existing user by apartment email and assigns them.

## Capabilities

### New Capabilities

- `bulk-assign-existing`: Assign existing tenant accounts to unassigned apartments in bulk, using the email stored on each apartment to find the matching user.

### Modified Capabilities

- `user-management`: Bulk-create page and its underlying API gain a second operational mode (assign-existing). The spec must capture the new endpoint, UI tab, and success/error semantics.

## Impact

- `src/app/admin/users/bulk-create/page.tsx` — add tab/mode switcher and new UI for assign-existing flow.
- `src/app/api/admin/unassigned-apartments/route.ts` — extend to also return apartments whose email matches an existing user (currently filtered to no-user-yet only).
- New API route `POST /api/admin/users/bulk-assign` (or extend `bulk-create`) — assign existing users to selected apartments.
- Unit tests for new API route and updated UI component.
- E2E test for the assign-existing flow.
- `openspec/specs/user-management/spec.md` — updated to reflect new requirements.
