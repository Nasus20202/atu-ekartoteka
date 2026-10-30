# Spec Delta

## ADDED Requirements

### Requirement: Skipped Record Warnings

The system SHALL add a warning to the per-HOA import result for each owner+apartment whose charge, notification or payment rows were skipped because no imported apartment matches them. The warning SHALL name the owner and apartment, give the number of skipped rows of each kind, and state the reason: the ID is not an owner ID, or the owner is in neither `lok.txt` nor the database. Skipped-record warnings SHALL NOT abort the import.

#### Scenario: Non-owner records are reported

- **GIVEN** `lok.txt` lists an entry whose ID does not start with `W` (e.g. a lease `N00001`), and charge and payment files contain rows for it
- **WHEN** the import completes
- **THEN** the result contains one warning for that owner+apartment with the counts of skipped charges and payments
- **AND** the warning says the ID is not an owner ID
- **AND** the import succeeds

#### Scenario: Records of an unknown owner are reported

- **GIVEN** a `wplaty.txt` row for an owner who is not in `lok.txt` and has no apartment in the database (e.g. a former owner on a first import)
- **WHEN** the import completes
- **THEN** the result contains one warning for that owner+apartment saying the owner is in neither `lok.txt` nor the database

#### Scenario: No warning when nothing is skipped

- **GIVEN** every charge, notification and payment row matches an imported apartment
- **WHEN** the import completes
- **THEN** no skipped-record warning is added

## MODIFIED Requirements

### Requirement: Naliczenia Import Validation

The system SHALL validate each entry in `nal_czynsz.txt` before committing to the database. The cross-file balance and Wplaty closing-balance checks SHALL abort the HOA import on failure. The cross-file balance check SHALL compare charges per owner, apartment and billing period. The line-total identity check (`totalAmount ≈ quantity × unitPrice`) SHALL be reported as a warning only and SHALL NOT abort the import.

#### Scenario: Line total mismatch reported as warning, import continues

- **GIVEN** a `nal_czynsz.txt` entry where `totalAmount` does not equal `quantity × unitPrice` within ±0.01
- **WHEN** import validation runs
- **THEN** a warning is recorded in the per-HOA result identifying the offending line and the difference
- **AND** the import continues using the file-provided `totalAmount` as the persisted value
- **AND** no error is recorded for that case

#### Scenario: Valid line totals produce no warning

- **GIVEN** all entries in `nal_czynsz.txt` have consistent totals
- **WHEN** import validation runs
- **THEN** no warnings are recorded for line totals and the import proceeds normally

#### Scenario: Cross-file charge sum still aborts on mismatch

- **GIVEN** the per-period sum of `nal_czynsz.totalAmount` for an owner and apartment differs from the same owner's `wplaty` monthly charge for that apartment by more than the cross-file tolerance
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Owner change with former-owner row without charges passes

- **GIVEN** an apartment whose `wplaty.txt` contains a row for the former owner with zero monthly charges and a row for the current owner
- **AND** `nal_czynsz.txt` contains charges for that apartment only under the current owner, matching the current owner's monthly charges
- **WHEN** import validation runs
- **THEN** no cross-file error is recorded for that apartment and the import proceeds

#### Scenario: Mid-year owner change with charges under both owners passes

- **GIVEN** an apartment where both the former and the current owner have non-zero monthly charges in `wplaty.txt` for the same year
- **AND** each owner's `nal_czynsz.txt` entries match that owner's monthly charges
- **WHEN** import validation runs
- **THEN** no cross-file error is recorded for that apartment

#### Scenario: Charges of another owner do not count

- **GIVEN** a `wplaty` row with non-zero monthly charges for an owner and apartment
- **AND** `nal_czynsz.txt` contains charges for that apartment and period only under a different owner
- **WHEN** import validation runs
- **THEN** a cross-file error is recorded for that owner's row and the import is aborted

#### Scenario: Import result UI surfaces warnings

- **GIVEN** an import that produced one or more warnings
- **WHEN** the admin views the import result card
- **THEN** the card shows an `Ostrzeżenia` section listing each warning with its apartment and message
- **AND** period, line and line-total difference are shown for warnings that carry them

### Requirement: Payment Import Validation

The system SHALL validate the closing balance of each entry in `wplaty.txt` before committing, and abort the HOA import if any entry fails. The system SHALL also validate that the opening balance of year N+1 matches the closing balance of year N when the database contains a complete record for year N, meaning one whose period ends on 31 December. The cross-year check SHALL evaluate every apartment and report each mismatch before aborting the import.

#### Scenario: Closing balance identity check

- **GIVEN** a `wplaty.txt` entry where `closingBalance` does not equal `openingBalance + totalPayments − totalCharges` within ±0.01
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Valid closing balance passes

- **GIVEN** all entries in `wplaty.txt` satisfy the balance identity
- **WHEN** import validation runs
- **THEN** no validation errors are recorded and the import proceeds normally

#### Scenario: Cross-year opening/closing balance mismatch aborts

- **GIVEN** a payment entry for year N+1 where the database contains a complete payment record for year N (ending on 31 December) with a different closing balance
- **WHEN** the imported opening balance for year N+1 does not match the stored closing balance for year N within ±0.01
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Cross-year balance passes when year N does not exist

- **GIVEN** a payment entry for year N+1
- **WHEN** no payment record for year N exists in the database for that apartment
- **THEN** the cross-year validation is skipped for that apartment and the import proceeds normally

#### Scenario: Cross-year balance skipped when year N is partial

- **GIVEN** a payment entry for year N+1
- **AND** the stored payment record for year N ends before 31 December (imported from a mid-year export)
- **WHEN** the imported opening balance for year N+1 differs from that record's closing balance
- **THEN** the cross-year validation is skipped for that apartment and the import proceeds normally

#### Scenario: All cross-year mismatches are reported

- **GIVEN** several apartments whose year N+1 opening balance mismatches a complete stored year N
- **WHEN** import validation runs
- **THEN** one error per mismatching apartment is recorded for that HOA
- **AND** the import is aborted without writing to the database

#### Scenario: Cross-year balance passes with matching balances (E2E)

- **GIVEN** an existing HOA (TEST01) has a seeded payment for year 2026 with closingBalance = -444.25
- **WHEN** the admin imports a wplaty.txt for year 2027 with openingBalance = -444.25 (matching the 2026 balance)
- **THEN** the cross-year check passes and the import succeeds
