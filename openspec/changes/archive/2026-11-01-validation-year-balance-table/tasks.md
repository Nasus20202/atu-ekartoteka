## 1. Year balance summary

- [x] 1.1 Add the pure summary module `src/lib/import/year-balance-overview.ts` that takes payment rows (apartment id, HOA id, year, opening balance and monthly payments) and charge sums, and returns per-HOA, per-year rows with summed opening and calculated closing balances, sorted by year. Verify: unit tests in `src/lib/import/__tests__/` cover summing across apartments, a single apartment, an HOA with no payments, and a year with no payments.
- [x] 1.2 Add the mismatch flag: a year's closing balance is marked when the next year's opening balance of the same HOA differs by more than `WPLATY_BALANCE_TOLERANCE`; the last year of an HOA is never marked. Verify: unit tests cover matching, mismatching, exactly-at-tolerance, and last-year cases.

## 2. Validation pipeline

- [x] 2.1 In `validate-database.ts`, load the HOA's payment rows and charge sums once, and attach the summary rows as `yearBalances` on `HOAImportResult`; add the optional field to `types.ts`. Verify: `validate-database.test.ts` checks that a two-year HOA gets two year rows with the mismatch flag set on the first year.
- [x] 2.2 Replace the unbounded `Promise.all` in `validateDatabase` with `mapWithConcurrency(hoas, IMPORT_HOA_CONCURRENCY, validateHoa)`. Verify: the test asserts results stay in HOA order and that no more than `IMPORT_HOA_CONCURRENCY` HOAs run at once.
- [x] 2.3 Keep the drift check running in on-demand validation and cover it: a stored year N+1 opening balance that differs from the derived closing balance of year N produces the per-apartment warning. Verify: a `validate-database.test.ts` case that fails if the warning is not produced.

## 3. Admin page

- [x] 3.1 Add the grid component `src/app/admin/import/year-balance-grid.tsx`: one row per HOA, an opening and a closing column for each year in ascending order, empty cells for years without payments, the mismatched closing cell in `text-destructive` with a "≠" text marker, and a legend that explains both. Verify: component test checks the columns, the empty cells, the red marker on a mismatch, and the legend text.
- [x] 3.2 Add the result banner `src/app/admin/import/validation-banner.tsx` with the three states from the spec: success without findings, success with warnings (warning count), failure with errors (error count and HOA count). Use the existing `SuccessMessage` and `Alert` components. Verify: component test checks each state's text and that no state relies on colour alone.
- [x] 3.3 Render the banner, then the grid, then the per-HOA findings in `ValidationResults`, also when there are no findings, and keep the existing download output unchanged. Verify: `validation-results` test checks the render order and that a clean database shows the success banner.

## 4. End-to-end and checks

- [x] 4.1 Extend `e2e/admin/validate-database.spec.ts` to assert the banner and the grid heading after validation runs. Verify: the Playwright spec passes against a database separate from the local development database. Done: four cases pass against `atu_ekartoteka_e2e`.
- [x] 4.2 Run `pnpm lint`, `pnpm format:check`, `pnpm tsc` and `pnpm test`. Verify: all pass.
- [x] 4.3 Compare the grid with the local database results for a sample HOA, by hand, against the drift warnings. Verify: a red closing value matches a difference between the summed values, and the per-apartment drift warnings still name each apartment.

## 5. Year status and newest-first grid

- [x] 5.1 Attribute warnings to years: add an optional `year` to `ImportWarning` and set it in the payment month, drift and cross-year checks; charge warnings use their period. Verify: `validators` and drift tests pass, and the cross-year test expects the year.
- [x] 5.2 Add `withYearStatus`: `error` for every year of an HOA with errors, `warning` for a year with issues (warnings for that year, HOA-wide warnings, and mismatches on the year or the year before), `ok` otherwise. Verify: unit tests cover ok, year-specific, period-based, HOA-wide, mismatch on both years and error cases.
- [x] 5.3 Change the banner: green only with no findings, amber with warning and mismatch counts, red for errors. Verify: banner tests cover all three states and that the amber state never says the validation passed.
- [x] 5.4 Show years newest first, add a status column per year and a status badge per HOA. Verify: grid tests check the year order and the status texts.
- [x] 5.5 Update the e2e assertion to accept the amber banner. Verify: the spec pattern matches the amber text (run pending, see 4.1).

- [x] 5.6 Attribute payment identity errors to their year: `paymentErrorYears` returns the year of each failing entry, and `HOAImportResult.yearErrors` carries it. Verify: validators tests cover the years of failing entries, and a pipeline test marks only the failing year as `error`.
- [x] 5.7 Status uses the year of each error; errors without a year still mark every year of the HOA. Verify: unit tests cover a year-specific error and an HOA-wide error.

## 6. Balance-only grid

- [x] 6.1 Remove the status column and the HOA status badge from the grid; the grid shows only opening and closing balances, the mismatch marker and the newest year first. Verify: grid tests check the columns, the empty cells, the mismatch marker and the year order.

## 7. Per-apartment mismatch, names, marks

- [x] 7.1 Compare the closing and opening balances only for the apartments present in both years, so an apartment that is new in the next year does not create a mismatch. Verify: unit tests cover an extra apartment in the next year and a real difference between apartments present in both years.
- [x] 7.2 Carry the HOA name into the validation result and show it in the grid instead of the identifier. Verify: grid test checks the name in the row header.
- [x] 7.3 Order each year as closing then opening, so the closing of a year sits next to the opening of the following year. Verify: grid test checks the column order.
- [x] 7.4 Show a check mark for an `ok` year and a cross for any other year, and show the cells of an `error` year in red. Verify: grid tests check the marks and the error colour.

## 8. Simple status

- [x] 8.1 Remove the check and cross marks from the cells. Verify: grid tests find no check or cross marks in the cells.
- [x] 8.2 Show an OK badge next to each HOA name when none of its values is red, and next to each year when no HOA has a red value in it. Verify: grid tests check the badge text for an HOA, a year and a warning-only HOA.
- [x] 8.3 Mark only errors and balance mismatches in red; warnings stay out of the grid. Verify: grid test shows that a warning-only HOA stays OK and its values are not red.

## 9. Details and new owners

- [x] 9.1 Carry the apartment label, owner and per-record comparison into the year balance rows, and the opening balance of records that are new in a year. Verify: overview tests cover statuses, the next opening and the new owner balance.
- [x] 9.2 Show the per-apartment records of a year on hover or focus, with mismatches first, and state the new owner balance in the opening cell. Verify: grid tests cover the order, leaving the value, and the new owner note.

## 10. Click details, skip option, sticky column, mock data

- [x] 10.1 Skip the full validation when asked: `validateDatabase({ skipFullValidation })` loads only the year balances, the route reads `skipFullValidation` from the JSON body, and the loaders move to `load-stored-entries.ts` and `load-year-balances.ts` to keep files under 200 lines. Verify: `validate-database.test.ts` checks that no file or cross-year check runs, and the route tests cover the flag.
- [x] 10.2 Add the checkbox "Pomiń pełną walidację" to the validation card and the banner state "Pełna walidacja pominięta" that does not say validation passed. Verify: card and banner tests.
- [x] 10.3 Show the apartment records of a year on click in a scrollable popover (shadcn `popover.tsx`), closing on Escape or an outside click. Verify: grid tests open the records on click, check the mismatch order and closing on Escape.
- [x] 10.4 Keep the HOA name column sticky while the year columns scroll sideways. Verify: grid test checks the sticky classes on the HOA header.
- [x] 10.5 Mock data script and database dropped at the user's request; the grid was checked on the local database and its stored years (2024 to 2026).
- [x] 10.8 Highlight new owner records in yellow in the records panel, and show a visible edge on the sticky HOA column. Verify: grid test checks the yellow row and the mismatch row colour.
- [x] 10.10 Show amounts with the shared `formatCurrency`, so values carry the `zł` unit. Verify: grid tests expect the unit.
- [x] 10.9 Make the balance values use the shared `Button` ghost style, and open the panel with the shared Radix `animate-in` and `animate-out` classes that the dropdown and dialog use. Verify: pending browser check (see 10.6).
- [x] 10.6 Check the grid, the sticky column and the popover in a browser. Done with Playwright against a scratch dev server on a separate e2e database: the popover opens and closes with the shared animation (opacity and scale change over about 150ms), the value hover fills the cell, and the records panel fits its columns.
- [x] 10.7 Add e2e cases for the skip checkbox and the click on a balance value. Verify: pending, run against a database other than the development database (see 4.1).

## Workflow follow-up

- Commit each task group separately with a conventional-commit message after confirmation.
- Archive the change after the PR is merged.
