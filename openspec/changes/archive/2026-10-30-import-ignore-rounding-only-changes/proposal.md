# Proposal

## Why

Re-importing the same unchanged files still reports changed records. For the TEST HOA, 259 charges are counted as updated on every import, even though the database values never change.

The cause is a precision mismatch:

- `nal_czynsz.txt` gives some quantities with 6 decimal places, e.g. `-132,580542`.
- Every imported decimal column is `Decimal(14, 4)`, so PostgreSQL stores `-132.5805`.
- The importers compare the stored value with the unrounded file value, so the two never match.

The result is misleading "Zaktualizowanych" counts and pointless writes. The same comparison exists in the notification and payment importers.

## What Changes

- Before deciding whether a record changed, the importers round incoming decimal values to the database scale: 4 decimal places, half away from zero, the same rounding PostgreSQL applies.
- A record whose values differ only below that precision is classified as unchanged. It is not written and not counted as updated.
- This applies to:
  - charges (`nal_czynsz.txt`)
  - charge notifications (`pow_czynsz.txt`)
  - payments (`wplaty.txt`)

## Non-goals

- Widening columns to keep more than 4 decimal places. Stored values and the UI stay as they are.
- Changes to the synthetic line numbering of duplicate charge lines. It works correctly: the TEST file parses into 9,516 rows with no colliding keys.
- Previous-owner rows that are skipped because their owner is missing from `lok.txt`. That is a separate topic.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-import`: the importers compare decimal values at the stored precision, so rounding-only differences are not reported as updates.

## Impact

- **Code:**
  - `src/lib/import/importers/charges.ts`
  - `src/lib/import/importers/notifications.ts`
  - `src/lib/import/importers/payment-data.ts`
  - a new shared comparison helper
- **Data:** no migration and no changes to existing data.
- **Tests:** the importer unit tests, plus a regression E2E test that imports the same file twice.
