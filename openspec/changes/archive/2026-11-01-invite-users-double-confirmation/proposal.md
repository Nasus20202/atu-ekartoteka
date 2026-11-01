# Proposal

## Why

The "Utwórz konta" button on the user management page creates tenant accounts and sends each new user an e-mail with a temporary password. The label describes the database write, not what the admin is doing: inviting the tenants. A single confirmation is also easy to pass through by accident, and the e-mails cannot be recalled once sent.

## What Changes

- Rename the submit button of the "create" tab from `Utwórz konta` to `Zaproś użytkowników`, and show `Zapraszanie...` while the request runs.
- Require two confirmations before the accounts are created:
  1. The existing list of accounts to create, with the action `Dalej`.
  2. A final confirmation that states the number of invitations to be sent, with the action `Zaproś użytkowników`, and `Wstecz` to return to the list.
- **BREAKING** (user-visible): the confirmation dialog no longer creates accounts on its first button press.

Non-goals:

- Renaming the `Utwórz konta` tab. It names the tab, not the action. (Open question for the user.)
- Changing what the create operation does: accounts, assignments and the e-mail are unchanged.
- Changing the "assign existing" tab.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-management`: the Bulk User Creation requirement gets the new button label and the two-step confirmation.

## Impact

- `src/app/admin/users/management/page.tsx`: submit label.
- `src/app/admin/users/management/confirm-create-dialog.tsx`: two steps.
- Unit tests in `src/app/admin/users/management/__tests__/`.
- `e2e/admin/admin-user-management-bulk-create-users.spec.ts`: two-step flow.
