## Context

On-demand validation lives in `src/lib/import/validate-database.ts`. For each HOA it loads charges and payments, runs the import validators, then runs two year-to-year checks:

- `validateCrossYearBalances` compares the opening balance with the closing balance stored from the file (`legacyClosingBalance`). These are ignored by the application.
- `validateBalanceDrift` compares the opening balance with the closing balance derived from charge records (`applyDerivedFigures` in `src/lib/utils/payment-balances.ts`). This is the check required by `Derived Balance Drift Warning`.

The import already processes HOAs with `mapWithConcurrency` and `IMPORT_HOA_CONCURRENCY` (`src/lib/import/import-handler.ts`). Validation currently uses an unbounded `Promise.all`. The import result page shows a green `SuccessMessage` when the import succeeded and a destructive `Alert` for errors (`src/app/admin/import/import-results.tsx`). See proposal.md for the problem and specs/data-import/spec.md for the requirements.

## Goals / Non-Goals

**Goals**

- Validation uses the same HOA concurrency helper and limit as the import.
- Each HOA gets a per-year balance summary that the UI can render without further calculation.
- The mismatch marker is computed on the server, so the UI only renders it.
- The result banner reads the same as the import result banner.

**Non-Goals**

- Changing the drift or cross-year warnings, or their thresholds.
- Per-apartment rows or per-apartment red marks in the table.
- Pagination or a year filter for the grid.

## Decisions

**Grid layout: one row per HOA, two columns per year.** Chosen over a list of HOA-year rows. The mismatch is a comparison between adjacent years, so the grid shows it on one line: the closing column of year N sits next to the opening column of year N+1 of the same HOA. Missing years show empty cells, so gaps are visible. Trade-off: each stored year adds two columns; the admin page has no year limit yet, so a long history scrolls sideways inside its own container.

**Aggregate per HOA and year.** The table sums the apartments of an HOA for each year. Trade-off: two apartments with opposite errors can cancel out in the sums. The per-apartment drift warnings still report every drifting apartment, so no error is hidden from the warnings list.

**Reuse `applyDerivedFigures` for the calculated closing.** The derivation is already tested and used by the drift check, so the table and the warning cannot disagree. The charge sums come from `findMonthlyChargeSums`, loaded once per HOA for all its apartments.

**Pure summary module.** A new module in `src/lib/import/` takes payment rows with their apartment id and the charge sums, and returns per-HOA, per-year rows with the mismatch flag. It does no I/O, so the rule can be tested without the database. The validation pipeline loads the data and calls it.

**Owner records.** An apartment record is one flat held by one owner: the import identifies it by owner and apartment. An owner change creates a new record with its own opening balance from the import. Balances are not linked between owner records, so a change of owner is not a validation error, and the mismatch is compared per record.

**Tolerance.** The mismatch uses `WPLATY_BALANCE_TOLERANCE` (±0.01), the same tolerance as the drift warnings.

**Concurrency.** `validateDatabase` calls `mapWithConcurrency(hoas, IMPORT_HOA_CONCURRENCY, validateHoa)`. The results keep the HOA order because the query orders by `externalId` and the helper keeps input order.

**Response shape.** `HOAImportResult` gets an optional `yearBalances` field. The import does not set it, so import responses do not change. Values are sent as fixed two-decimal strings, consistent with the other money values in the response.

**Result banner.** Passes when no HOA has errors, matching the import's `success` flag. Warnings do not fail the validation; the banner shows their count, as the import does. The banner is rendered at the top of the validation result and uses the existing `SuccessMessage` and `Alert` components.

**UI.** The grid and the banner live in `src/app/admin/import/`. `ValidationResults` renders the banner, then the grid, then the per-HOA findings, also when there are no findings. A mismatched closing cell gets `text-destructive` and a "≠" marker, and the legend explains both, so the state is not conveyed by colour alone.

**Records on click, in a popover.** The records of a year open on click, not on hover, so the panel can be scrolled and stays open while the admin reads it. The value is a button inside the cell, which keeps it keyboard accessible. The popover is the shadcn `popover.tsx` on `@radix-ui/react-popover`; it is rendered in a portal, so the scrolling grid container does not clip it, and it handles Escape, outside clicks and positioning.

**Skipping the full validation.** The checkbox "Pomiń pełną walidację" skips the file checks, the cross-year checks and the drift checks. Only the year balances are loaded, so the charge and payment rows of the HOA are not read. The banner then says the full validation was skipped and does not say that validation passed. The import page keeps its own "Pomiń walidację" option, which is separate.

**Sticky HOA column.** The HOA name column is sticky on the left, so the year columns can scroll sideways inside the table container. The table does not wrap cells, so long histories scroll instead of squeezing the columns.

## Risks / Trade-offs

- [Offsetting errors hidden by sums] → per-apartment drift warnings remain; the grid states that its values are HOA totals.
- [Wide grid for many years] → the grid scrolls inside its own container; the years are the years stored in the database.
- [Concurrency gives little speed-up on a small database] → the limit is the same as the import, so validation stays within the pool size used by import.

## Migration Plan

No schema change and no data migration. Deploy as a normal release. Rollback: revert the commit; the optional field disappears and the UI falls back to the findings list.

## Open Questions

None.
