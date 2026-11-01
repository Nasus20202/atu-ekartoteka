# Proposal

## Why

The import result card lists all warnings in one flat list. Warnings come from five different checks, so an admin cannot tell which check raised a warning or what to do about it. The cross-file charge warning also gives no amount for the part of the difference that the settlement lines do not explain.

## What Changes

- Every import warning carries a `kind` from a fixed set: `line-total`, `charges-mismatch`, `opening-balance-file`, `opening-balance-calculated`, `skipped-records`.
- The import result card groups warnings by kind, each group with a title, a count and a one-sentence description, in a fixed order.
- A charges mismatch that the `Wyrównanie` lines do not explain states the unexplained difference in the warning message.

Non-goals:

- Changing which checks run or their tolerances.
- Changing the warning download files. They keep one line per warning.
- Changing the validation banner or the year balance table.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-import`: adds the warning grouping requirement and extends the naliczenia validation requirement with the unexplained difference.

## Impact

- `src/lib/import/types.ts`: `ImportWarningKind` and the `kind` field.
- `src/lib/import/validators.ts`, `balance-drift-validation.ts`, `cross-year-validation.ts`, `skipped-records.ts`: set the kind and build the unexplained-difference message.
- `src/app/admin/import/warning-groups.ts` (new): group titles, descriptions and the grouping function.
- `src/app/admin/import/import-warnings.tsx`: renders the groups.
- Tests in `src/app/admin/import/__tests__/` and `src/lib/import/__tests__/`.

Status: the implementation is in the working tree and not committed yet, so this change records work already done.
