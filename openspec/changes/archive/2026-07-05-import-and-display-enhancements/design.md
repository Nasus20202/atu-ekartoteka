## Context

The current import system processes NAL-CZYNSZ and WPLATY files with upsert-by-key logic. Several edge cases and UX gaps need addressing: duplicate charge lines with identical keys are silently overwritten, validation errors cannot be downloaded for offline review, and display components lack configurable precision or data-boundary awareness.

## Goals / Non-Goals

**Goals:**

- All five improvements from the proposal implemented with minimal schema changes
- Backward-compatible for existing data — no migration required
- Error download as plain `.txt` (per-HOA + combined) from the import result UI
- Display share rounded to 4 decimal places with trailing zeros stripped in all views

**Non-Goals:**

- No new database fields or columns
- No changes to the clean-import or transactional consistency flows
- No changes to the charge notification import flow

## Decisions

1.  **Duplicate charge detection via synthetic line numbers**: Instead of changing the composite key (`apartmentId + period + externalLineNo`), detect duplicates within the file during parsing using an in-memory counter per `apartmentCode + period + lineNo`. Assign synthetic line number = `originalLineNo + 1_000_000 * dupIndex`. This preserves the existing upsert logic and avoids schema changes. The offset of 1,000,000 makes collisions with existing DB records practically impossible; if a collision somehow occurs, `skipDuplicates: true` in `createMany` silently drops the record.

2.  **Cross-year balance validation inside the transaction**: Before importing payments for a year N+1, query the DB (within the same transaction) for the year N payment record. If it exists and `importedOpeningBalance(N+1) ≠ storedClosingBalance(N)` within ±0.01, abort the HOA import. This follows the existing pattern where all DB writes happen inside `$transaction`.

3.  **Error export as generated `.txt` in the UI**: Add a client-side function in the import result page that serialises `HOAImportResult.errors[]` and `HOAImportResult.warnings[]` into a plain-text format. Provide "Pobierz błędy" buttons per HOA card and one combined "Pobierz wszystkie błędy" at the top. No server-side endpoint needed.

4.  **Share precision with trailing zero removal**: The share percentage is computed as `(shareNumerator / shareDenominator) * 100`, rounded to 4 decimal places via `.toFixed(4)`, then trailing zeros are stripped (e.g. `5.0500` → `5.05`, `50.0000` → `50`). A shared `formatSharePercent` utility in `src/lib/utils/index.ts` is used across all rendering locations.

5.  **Future month hiding using HOA `chargesDataDate`**: In payment and charge list views, compare each period against the HOA's `chargesDataDate`. Periods after the data date are omitted. For charges without a HOA association, no filtering is applied.

## Risks / Trade-offs

- **[Risk] Synthetic line numbers could theoretically collide with existing DB records** → Offset of 1,000,000 makes this practically impossible. If a collision somehow occurs, `skipDuplicates: true` silently drops the record — a production monitoring alert should catch unexpected row count discrepancies.
- **[Risk] `chargesDataDate` may be null** → When null, show all months (current behavior). The filtering is purely additive.
- **[Trade-off] Error export as client-side `.txt` generation** avoids a new API endpoint but depends on the full error list being already in the client state. For very large imports this could be memory-heavy, but import result data is bounded by a single HOA's data.
