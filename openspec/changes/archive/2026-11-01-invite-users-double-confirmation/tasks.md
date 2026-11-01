# Tasks

## 1. Button label

- [x] 1.1 Change the create-tab submit label to `Zaproś użytkowników` and the pending label to `Zapraszanie...` in `src/app/admin/users/management/page.tsx`; verify `src/app/admin/users/management/__tests__/page.test.tsx` finds the button by the new name

## 2. Double confirmation

- [x] 2.1 Split `ConfirmCreateDialog` into a `review` step with `Dalej` and a `final` step with `Wstecz` and `Zaproś użytkowników`; `onConfirm` is called only from the final step; verify `src/app/admin/users/management/__tests__/confirm-create-dialog.test.tsx` covers that `Dalej` sends nothing, that `Wstecz` returns to the list, and that cancelling from the first step calls `onCancel`

## 3. Tests

- [x] 3.1 Update the page tests to go through both steps and to read the final button inside the dialog; verify `pnpm exec vitest run src/app/admin/users/management` passes (10 files, 93 tests)
- [x] 3.2 Update `e2e/admin/admin-user-management-bulk-create-users.spec.ts` to the two-step flow; verify the spec compiles and lints (`pnpm exec eslint`)
- [ ] 3.3 Run `e2e/admin/admin-user-management-bulk-create-users.spec.ts`; blocked: the development database holds real HOAs, so the `Test HOA` the spec expects is not on the first page of the list

## Workflow follow-up

- Confirm with the user that the tab label `Utwórz konta` should stay.
- Archive the change after review.
