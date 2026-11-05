# Proposal

## Why

`openspec validate --specs --strict` fails for four specs because ten requirement descriptions exceed 500 characters. Each one bundles several behaviours, which makes it hard to scan, and the strict check cannot be used as a gate while it is red.

## What Changes

- Cut each of the ten long requirements down to one behaviour and move every other behaviour into its own new requirement with its own scenario.
- Keep every existing requirement header and every existing scenario unchanged.
- No code, API or data model change, and no behaviour change: the sentences are redistributed, not reworded, except where a sentence that had no `SHALL` gained one so it stands as a requirement (owner validity end date).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `authentication`: split Server Action Authorization Guard.
- `charges-and-payments`: split Balances Derived from Opening Balance.
- `data-import`: split Batch File Import, WMB Files Per Data Type, On-Demand Database Validation, Naliczenia Import Validation Severity, Payment Import Validation Severity, Imported Payment Values Kept in Legacy Fields and Owner Validity Dates Import.
- `tooling`: split Client Reads With SWR.

## Impact

- `openspec/specs/{authentication,charges-and-payments,data-import,tooling}/spec.md` only.

## Non-goals

- Changing what any requirement says the system must do.
- Reorganising capabilities or renaming existing requirements.
