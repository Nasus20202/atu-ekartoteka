# Tasks

## 1. Warning kinds

- [x] 1.1 Add `ImportWarningKind` and the required `kind` field to `ImportWarning` in `src/lib/import/types.ts`; verify `pnpm exec tsc --noEmit` passes with every warning creator setting a kind
- [x] 1.2 Set the kind in `validators.ts` (`line-total`, `charges-mismatch`), `balance-drift-validation.ts` (`opening-balance-calculated`), `cross-year-validation.ts` (`opening-balance-file`) and `skipped-records.ts` (`skipped-records`); verify the existing validator tests in `src/lib/import/__tests__/` pass

## 2. Unexplained difference

- [x] 2.1 Append `(niewyjaśniona różnica X)` to the charges-mismatch message when the settlement lines do not explain the month's difference in `src/lib/import/validators.ts`; verify `src/lib/import/__tests__/validators-cross-file.test.ts` covers an explained and an unexplained month

## 3. Grouping

- [x] 3.1 Add `WARNING_GROUPS` and `groupWarnings` in `src/app/admin/import/warning-groups.ts`; verify `src/app/admin/import/__tests__/warning-groups.test.ts` covers display order, order within a group, empty groups and the title and description per kind
- [x] 3.2 Render one section per group in `src/app/admin/import/import-warnings.tsx`; verify `src/app/admin/import/__tests__/import-warnings.test.tsx` covers the group headings with counts, and that a warning without period, line or difference still renders

## 4. Verification

- [x] 4.1 Run the unit suite on the working tree and verify it passes; `src/app/admin/import/__tests__/import-results.test.tsx` passes now (33 files, 319 tests across `src/app/admin/import` and `src/lib/import`)
- [ ] 4.2 Commit the warning work as its own commit; not done yet, waiting for approval

## Workflow follow-up

- Confirm the group descriptions with the user before committing.
- Archive the change after the commit.
