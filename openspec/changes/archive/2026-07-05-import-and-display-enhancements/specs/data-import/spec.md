## MODIFIED Requirements

### Requirement: Charge Import

The system SHALL parse charge records from a NAL-CZYNSZ format file and upsert them per apartment and billing period. When duplicate rows with the same `apartmentId + period + externalLineNo` are encountered, the system SHALL assign a synthetic line number instead of overwriting.

#### Scenario: Import new charges

- **GIVEN** charge entries in the import file for an apartment and period
- **WHEN** import runs
- **THEN** charge records are created with description, quantity, unit, unit price, total amount, and billing period

#### Scenario: Upsert on re-import

- **GIVEN** charges already existing for an apartment and billing period
- **WHEN** the same file is imported again (non-clean mode)
- **THEN** existing records are updated rather than duplicated (matched by `apartmentId` + `period` + `externalLineNo`)

#### Scenario: Duplicate rows within a single file get synthetic line numbers

- **GIVEN** a `nal_czynsz.txt` with two rows sharing the same `apartmentId`, `period`, and `externalLineNo`
- **WHEN** the charge parser processes the second occurrence
- **THEN** the second row is stored with `externalLineNo = originalLineNo + 1000000` to make it unique
- **AND** the parser logs an info-level message documenting the synthetic line number for auditability (server log, not user-visible warning)

#### Scenario: No duplicates — no modification

- **GIVEN** a `nal_czynsz.txt` with all unique `apartmentId + period + externalLineNo` combinations
- **WHEN** the charge parser processes the file
- **THEN** all rows are stored with their original line numbers unchanged

### Requirement: Payment Import

The system SHALL parse payment records from a WPLATY format file and upsert them per apartment and year.

#### Scenario: Import new payments

- **GIVEN** payment entries in the import file
- **WHEN** import runs
- **THEN** payment records are created with opening/closing balances and monthly payment and charge columns for all 12 months

#### Scenario: Upsert on re-import

- **GIVEN** a payment record already existing for an apartment and year
- **WHEN** the same file is imported again
- **THEN** the record is updated rather than duplicated

#### Scenario: Parse charges from payment files

- **GIVEN** a payment file that also contains charge data
- **WHEN** import runs
- **THEN** monthly charge columns are populated alongside monthly payment columns

### Requirement: Payment Import Validation

The system SHALL validate the closing balance of each entry in `wplaty.txt` before committing, and abort the HOA import if any entry fails. The system SHALL also validate that the opening balance of year N+1 matches the closing balance of year N when the latter exists in the database.

#### Scenario: Closing balance identity check

- **GIVEN** a `wplaty.txt` entry where `closingBalance` does not equal `openingBalance + totalPayments − totalCharges` within ±0.01
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Valid closing balance passes

- **GIVEN** all entries in `wplaty.txt` satisfy the balance identity
- **WHEN** import validation runs
- **THEN** no validation errors are recorded and the import proceeds normally

#### Scenario: Cross-year opening/closing balance mismatch aborts

- **GIVEN** a payment entry for year N+1 where the database contains a payment record for year N with a different closing balance
- **WHEN** the imported opening balance for year N+1 does not match the stored closing balance for year N within ±0.01
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Cross-year balance passes when year N does not exist

- **GIVEN** a payment entry for year N+1
- **WHEN** no payment record for year N exists in the database for that apartment
- **THEN** the cross-year validation is skipped for that apartment and the import proceeds normally

#### Scenario: Cross-year balance passes with matching balances (E2E)

- **GIVEN** an existing HOA (TEST01) has a seeded payment for year 2026 with closingBalance = -444.25
- **WHEN** the admin imports a wplaty.txt for year 2027 with openingBalance = -444.25 (matching the 2026 balance)
- **THEN** the cross-year check passes and the import succeeds

## ADDED Requirements

### Requirement: Import Error Export

The system SHALL provide a mechanism to download validation errors and warnings after a failed import, both per-HOA and combined.

#### Scenario: Per-HOA error download

- **GIVEN** an import where one or more HOAs have validation errors
- **WHEN** the admin views the import result and clicks "Pobierz błędy" on a specific HOA card
- **THEN** a `.txt` file is downloaded containing all errors and warnings for that HOA, each on a separate line with apartment identifier, period, and error description
- **AND** each HOA section is labelled `=== Wspólnota: {id} ===` (Polish terminology)

#### Scenario: Combined error download

- **GIVEN** an import with errors across multiple HOAs
- **WHEN** the admin clicks "Pobierz wszystkie błędy"
- **THEN** a single `.txt` file is downloaded containing errors and warnings from all HOAs, grouped by HOA identifier
- **AND** the summary line uses Polish (e.g. `Łącznie: 2 wspólnoty, 3 błędy, 1 ostrzeżenie`)

#### Scenario: Download only when errors exist

- **GIVEN** a successful import with no errors or warnings
- **WHEN** the admin views the result
- **THEN** no download buttons for errors are rendered
