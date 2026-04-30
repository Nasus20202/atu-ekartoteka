## ADDED Requirements

### Requirement: Decimal Precision for Imported Money Values

The system SHALL store all monetary values from imported files (`nal_czynsz.txt`, `wplaty.txt`) as `Decimal(14, 4)` and SHALL persist the file-provided value verbatim without recomputation or rounding.

#### Scenario: File totalAmount stored verbatim

- **GIVEN** a `nal_czynsz.txt` entry with `quantity = 1.42`, `unitPrice = 100.0725`, and file `totalAmount = 142.10`
- **WHEN** import runs
- **THEN** the `Charge.totalAmount` column stores `142.1000` (the file's value), NOT the recomputed `142.10295`

#### Scenario: Sub-grosz precision preserved end-to-end

- **GIVEN** any monetary value in a source file with up to 4 decimal digits (e.g. `1,2345`)
- **WHEN** the value is parsed, persisted, and read back via the Prisma client
- **THEN** the round-tripped value has the same 4-decimal-digit representation, with no Float-induced drift

#### Scenario: Diff comparison uses Decimal equality

- **GIVEN** a previously-imported `Charge` row and a re-imported file row with identical decimal values
- **WHEN** the importer compares them to decide between create/update/skip
- **THEN** equality is determined via `Prisma.Decimal.equals()` (not `===`) and an unchanged row is correctly classified as `unchanged` rather than `updated`

## MODIFIED Requirements

### Requirement: Naliczenia Import Validation

The system SHALL validate each entry in `nal_czynsz.txt` before committing to the database. The cross-file balance and Wplaty closing-balance checks SHALL abort the HOA import on failure. The line-total identity check (`totalAmount ≈ quantity × unitPrice`) SHALL be reported as a warning only and SHALL NOT abort the import.

#### Scenario: Line total mismatch reported as warning, import continues

- **GIVEN** a `nal_czynsz.txt` entry where `totalAmount` does not equal `quantity × unitPrice` within ±0.01
- **WHEN** import validation runs
- **THEN** a warning is recorded in the per-HOA result identifying the offending line and the difference
- **AND** the import continues using the file-provided `totalAmount` as the persisted value
- **AND** no error is recorded for that case

#### Scenario: Valid line totals produce no warning

- **GIVEN** all entries in `nal_czynsz.txt` have `totalAmount ≈ quantity × unitPrice`
- **WHEN** import validation runs
- **THEN** no warnings are recorded for line totals and the import proceeds normally

#### Scenario: Cross-file charge sum still aborts on mismatch

- **GIVEN** the per-period sum of `nal_czynsz.totalAmount` for an apartment differs from the corresponding `wplaty` monthly charge by more than the cross-file tolerance
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Import result UI surfaces warnings

- **GIVEN** an import that produced one or more line-total warnings
- **WHEN** the admin views the import result card
- **THEN** the card shows a "Ostrzeżenia" section listing each warning with apartment, period, and the line-total difference
