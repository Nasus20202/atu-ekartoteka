# Spec Delta

## MODIFIED Requirements

### Requirement: Decimal Precision for Imported Money Values

The system SHALL store all monetary values from imported files (`nal_czynsz.txt`, `wplaty.txt`) as `Decimal(14, 4)` and SHALL persist the file-provided value verbatim without recomputation. Values with more than 4 decimal digits SHALL be stored rounded to 4 decimal digits (half away from zero), and change detection SHALL compare values at that stored precision.

#### Scenario: File totalAmount stored verbatim

- **GIVEN** a `nal_czynsz.txt` entry with `quantity = 1.42`, `unitPrice = 100.0725`, and file `totalAmount = 142.10`
- **WHEN** import runs
- **THEN** the `Charge.totalAmount` column stores `142.1000` and not the recomputed `142.10295`

#### Scenario: Sub-grosz precision preserved end-to-end

- **GIVEN** any monetary value in a source file with up to 4 decimal digits (for example `1,2345`)
- **WHEN** the value is parsed, persisted, and read back via the Prisma client
- **THEN** the round-tripped value has the same 4-decimal-digit representation, with no float-induced drift

#### Scenario: Diff comparison uses Decimal equality

- **GIVEN** a previously imported `Charge` row and a re-imported file row with identical decimal values
- **WHEN** the importer compares them to decide between create, update, or skip
- **THEN** equality is determined via `Prisma.Decimal.equals()` and an unchanged row is correctly classified as `unchanged` rather than `updated`

#### Scenario: Rounding-only difference is not an update

- **GIVEN** a `nal_czynsz.txt` row with `quantity = -132,580542` previously imported and stored as `-132.5805`
- **WHEN** the same file is imported again
- **THEN** the charge is classified as unchanged, is not written, and is not counted in `updated`

#### Scenario: Real change below file precision but above stored precision

- **GIVEN** a stored charge with `quantity = 10.1234`
- **WHEN** a file row for the same charge has `quantity = 10,123600`
- **THEN** the charge is classified as updated and stored as `10.1236`

#### Scenario: Same rule for notifications and payments

- **GIVEN** a `pow_czynsz.txt` or `wplaty.txt` row whose decimal values differ from stored values only beyond 4 decimal digits
- **WHEN** the file is re-imported
- **THEN** the notification or payment is classified as unchanged and not counted in `updated`

#### Scenario: Re-importing identical files reports no updates

- **GIVEN** an HOA whose files were just imported
- **WHEN** exactly the same files are imported again (non-clean mode)
- **THEN** the created and updated counts for apartments, charges, notifications, and payments are all 0
