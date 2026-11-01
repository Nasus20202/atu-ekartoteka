## ADDED Requirements

### Requirement: On-Demand Database Validation

The system SHALL let an administrator run, from the import page, the import validation checks (line totals, payment balance identity, calculated versus imported monthly charges, year-to-year balance drift) against the data already stored in the database, without importing files and without modifying data. Results SHALL be reported per HOA in the same warning and error format and download options as an import result.

#### Scenario: Validation of stored data

- **GIVEN** an admin on the import page
- **WHEN** they trigger database validation
- **THEN** the checks run for every HOA and a per-HOA result with warnings and errors is displayed

#### Scenario: Clean database

- **GIVEN** stored data with no inconsistencies
- **WHEN** validation runs
- **THEN** a success message with no warnings or errors is shown

#### Scenario: Data not modified

- **WHEN** validation runs
- **THEN** no record is created, changed or deleted

#### Scenario: Admin only

- **WHEN** a non-admin calls the validation endpoint
- **THEN** the request is rejected as unauthorized

### Requirement: Naliczenia Import Validation Severity

The system SHALL validate each entry in `nal_czynsz.txt` before committing to the database. The Wplaty closing-balance check SHALL abort the HOA import on failure. The cross-file charge check SHALL compare charges per owner, apartment and billing period against the monthly charges imported from `wplaty.txt`; because those imported columns are known to be unreliable and are no longer used for display, a mismatch SHALL be reported as a warning and SHALL NOT abort the import. Each such warning SHALL state that the field from the files is ignored by the application. Mismatches SHALL be rolled up into one warning per owner, apartment and year that lists each differing month with both values, and states when a month's difference equals the sum of its `Wyrównanie` lines. The line-total identity check (`totalAmount ≈ quantity × unitPrice`) SHALL be reported as a warning only and SHALL NOT abort the import.

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

#### Scenario: Cross-file charge sum mismatch reported as warning

- **GIVEN** the per-period sum of `nal_czynsz.totalAmount` for an owner and apartment differs from the same owner's `wplaty` monthly charge for that apartment by more than the cross-file tolerance
- **WHEN** import validation runs
- **THEN** a single warning is recorded for that owner, apartment and year listing each differing period with both values
- **AND** the import continues and the imported monthly charge is stored in the legacy column unchanged

#### Scenario: Owner change with former-owner row without charges passes

- **GIVEN** an apartment whose `wplaty.txt` contains a row for the former owner with zero monthly charges and a row for the current owner
- **AND** `nal_czynsz.txt` contains charges for that apartment only under the current owner, matching the current owner's monthly charges
- **WHEN** import validation runs
- **THEN** no cross-file warning is recorded for that apartment and the import proceeds

#### Scenario: Mid-year owner change with charges under both owners passes

- **GIVEN** an apartment where both the former and the current owner have non-zero monthly charges in `wplaty.txt` for the same year
- **AND** each owner's `nal_czynsz.txt` entries match that owner's monthly charges
- **WHEN** import validation runs
- **THEN** no cross-file warning is recorded for that apartment

#### Scenario: Charges of another owner do not count

- **GIVEN** a `wplaty` row with non-zero monthly charges for an owner and apartment
- **AND** `nal_czynsz.txt` contains charges for that apartment and period only under a different owner
- **WHEN** import validation runs
- **THEN** a cross-file warning is recorded for that owner's row and the import continues

#### Scenario: Mismatch caused by settlement lines is identified

- **GIVEN** a month where the `nal_czynsz.txt` sum exceeds or falls short of the `wplaty` charge by exactly the sum of that month's `Wyrównanie` lines
- **WHEN** import validation runs
- **THEN** the warning states that the difference equals the settlement lines

#### Scenario: Import result UI surfaces warnings

- **GIVEN** an import that produced one or more warnings
- **WHEN** the admin views the import result card
- **THEN** the card shows an `Ostrzeżenia` section listing each warning with its apartment and message
- **AND** period, line and line-total difference are shown for warnings that carry them

### Requirement: Payment Import Validation Severity

The system SHALL validate the closing balance of each entry in `wplaty.txt` before committing, and abort the HOA import if any entry fails the identity check. The system SHALL also compare the opening balance of year N+1 with the closing balance of year N stored from the files when the database contains a complete record for year N, meaning one whose period ends on 31 December. A mismatch SHALL be reported as one warning per apartment that states the closing balance from the file is ignored by the application, and SHALL NOT abort the import, because the closing balances of closed years in the files omit settlement lines and are not used for display.

#### Scenario: Closing balance identity check

- **GIVEN** a `wplaty.txt` entry where `closingBalance` does not equal `openingBalance + totalPayments − totalCharges` within ±0.01
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Valid closing balance passes

- **GIVEN** all entries in `wplaty.txt` satisfy the balance identity
- **WHEN** import validation runs
- **THEN** no validation errors are recorded and the import proceeds normally

#### Scenario: Cross-year opening/closing balance mismatch warns

- **GIVEN** a payment entry for year N+1 where the database contains a complete payment record for year N (ending on 31 December) with a different stored closing balance
- **WHEN** the imported opening balance for year N+1 does not match the stored closing balance for year N within ±0.01
- **THEN** a warning naming the apartment and both values is recorded for that HOA and the import continues

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
- **THEN** one warning per mismatching apartment is recorded for that HOA and the import completes

### Requirement: Imported Payment Values Kept in Legacy Fields

The system SHALL store the monthly charges and the closing balance of each `wplaty.txt` entry unchanged in the legacy payment fields when it creates the payment record, SHALL overwrite them on re-import when any of them differs from the stored value, and SHALL keep validating them: the closing-balance identity check (which aborts the import), the cross-file charge check and the year-to-year check on the stored closing balance (both warnings) all run on the values from the files. These values SHALL NOT be presented anywhere in the application and SHALL NOT be changed by any calculation.

#### Scenario: Created with the file values

- **GIVEN** a `wplaty.txt` entry for an apartment and year without a stored payment record
- **WHEN** the file is imported
- **THEN** the record is created with the file's monthly charges and closing balance in the legacy fields

#### Scenario: Updated when a file value changes

- **GIVEN** a stored payment record whose only difference from the re-imported entry is one monthly charge
- **WHEN** the file is imported again
- **THEN** the record is updated and the legacy fields hold the new file values

#### Scenario: Unchanged values cause no update

- **GIVEN** a stored payment record equal to the re-imported entry
- **WHEN** the file is imported again
- **THEN** the record is not updated

#### Scenario: Calculated figures never written back

- **WHEN** monthly charges and closing balances are calculated from charge records for display
- **THEN** the legacy fields keep the values from the files

#### Scenario: Validated on the file values

- **GIVEN** a `wplaty.txt` entry whose closing balance breaks the identity check
- **WHEN** import validation runs
- **THEN** the same error as before is recorded and the HOA import is aborted

### Requirement: Derived Balance Drift Warning

The system SHALL, in addition to the existing payment import validation, compare the opening balance of year N+1 with the closing balance of year N derived from stored data (opening balance plus payments minus calculated charges) when the database contains a complete record for year N, meaning one whose period ends on 31 December. A mismatch SHALL be reported as one warning per apartment and SHALL NOT abort the import.

#### Scenario: Year-to-year balance drift reported as warning

- **GIVEN** a payment entry for year N+1 where the database contains a complete payment record for year N
- **WHEN** the imported opening balance for year N+1 differs from the derived closing balance of year N by more than ±0.01
- **THEN** a warning naming the apartment and both values is recorded and the import continues

#### Scenario: Matching balances produce no warning

- **GIVEN** an imported opening balance for year N+1 equal to the derived closing balance of year N
- **WHEN** import validation runs
- **THEN** no balance warning is recorded

#### Scenario: Drift check skipped without a complete previous year

- **GIVEN** a payment entry for year N+1 for an apartment with no stored year N, or with a year N that ends before 31 December
- **WHEN** import validation runs
- **THEN** the drift check is skipped for that apartment

#### Scenario: All drifting apartments are reported

- **GIVEN** several apartments whose year N+1 opening balance differs from the derived closing balance of year N
- **WHEN** import validation runs
- **THEN** one warning per drifting apartment is recorded and the import completes

#### Scenario: Values from the files are still stored and validated

- **GIVEN** a `wplaty.txt` entry with monthly charges and a closing balance
- **WHEN** the file is imported
- **THEN** both values are stored unchanged, the closing-balance identity check still aborts on failure and the cross-year check against the stored closing balance reports a warning

## REMOVED Requirements

### Requirement: Naliczenia Import Validation

**Reason**: The cross-file charge check no longer aborts the import, because the monthly charge columns in `wplaty.txt` are invalid (external export bug) and are no longer used.

**Migration**: Replaced by "Naliczenia Import Validation Severity", which keeps every other scenario and turns the cross-file mismatch into a warning.

### Requirement: Payment Import Validation

**Reason**: The year-to-year check compared against the imported closing balance of year N, which is unreliable for closed years, and aborted the import on mismatch.

**Migration**: Replaced by "Payment Import Validation Severity": the closing-balance identity check still aborts; the year-to-year check on the stored closing balance only warns.
