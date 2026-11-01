# Capability: Data Import

## Purpose

Allows admins to import apartment, charge, payment, and charge notification data from legacy HOA system files (`.txt` / `.wmb` format), supporting batch processing across multiple HOAs in a single operation.

## Requirements

### Requirement: Batch File Import

The system SHALL allow admins to upload a collection of legacy files and process them as a batch, grouping files by HOA. A `.txt` file SHALL be recognised by its name prefix (`lok`, `nal_czynsz`, `pow_czynsz`, `wplaty`), ignoring letter case, so suffixed names such as `wplaty_2026.txt` are accepted. Several files of one kind in one HOA folder SHALL be merged, and a record present in more than one of them SHALL stop the HOA import with an error naming both files, even when validation is skipped.

#### Scenario: Successful batch import

- **GIVEN** an authenticated admin
- **WHEN** they upload a set of files covering one or more HOAs
- **THEN** files are grouped by HOA identifier, each HOA is processed independently, and a summary of created/updated/errored records is returned for each HOA

#### Scenario: Suffixed TXT file names

- **GIVEN** an HOA folder containing `wplaty_2026.txt` and `nal_czynsztest.txt`
- **WHEN** the admin imports the folder
- **THEN** the files are imported as payments and charges respectively

#### Scenario: Several files of the same kind are merged

- **GIVEN** an HOA folder containing `wplaty1.txt` with payments for 2025 and `wplaty2.txt` with payments for 2026
- **WHEN** the admin imports the folder
- **THEN** payments from both files are validated and imported together

#### Scenario: Record repeated across files

- **GIVEN** an HOA folder where `wplaty1.txt` and `wplaty2.txt` both contain the 2025 payment row of owner `W001`, apartment `A1`
- **WHEN** the admin imports the folder, with or without skipping validation
- **THEN** the HOA import stops before any data is written and reports `Zduplikowane rekordy w plikach wplaty1.txt i wplaty2.txt (1): W001#A1|2025`

#### Scenario: Multipart and JSON (base64) upload formats

- **GIVEN** an admin uploading files
- **WHEN** files are submitted as `multipart/form-data`
- **THEN** files are read directly from form data
- **WHEN** files are submitted as `application/json` with base64 gzip-compressed content
- **THEN** files are decompressed and processed identically to the multipart path

#### Scenario: Admin-only access

- **GIVEN** a non-admin user
- **WHEN** they attempt to call the import endpoint
- **THEN** the request is rejected with 401

#### Scenario: No files provided

- **GIVEN** an admin submitting an import request
- **WHEN** the request contains no files
- **THEN** the request is rejected with an appropriate error

---

### Requirement: Apartment Import

The system SHALL parse apartment records from a LOK-format file and upsert them into the database.

#### Scenario: Create new apartment

- **GIVEN** an apartment in the import file that does not exist in the database
- **WHEN** import runs
- **THEN** the apartment is created with all fields (owner, address, building, number, postal code, city, share numerator/denominator, external IDs)

#### Scenario: Update existing apartment

- **GIVEN** an apartment already in the database (matched by `externalOwnerId` + `externalApartmentId`)
- **WHEN** import runs with updated data
- **THEN** the apartment's fields are updated to match the file

#### Scenario: Mark inactive apartments

- **GIVEN** apartments previously imported for a HOA that are absent from the current file
- **WHEN** import runs
- **THEN** those apartments are marked as `isActive: false`

#### Scenario: Respect existing owner assignment

- **GIVEN** an apartment already assigned to a tenant user
- **WHEN** import runs
- **THEN** the `userId` assignment is preserved (not overwritten by import)

---

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

---

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

---

### Requirement: Charge Notification Import

The system SHALL parse charge notification entries from a POW-CZYNSZ format file and upsert them per apartment.

#### Scenario: Import notifications

- **GIVEN** notification entries in the import file
- **WHEN** import runs
- **THEN** `ChargeNotification` records are created with description, quantity, unit, unit price, and total amount

---

### Requirement: Clean Import Mode

The system SHALL support a clean import mode that deletes existing charges, notifications, and payments for a HOA before inserting new data.

#### Scenario: Clean import clears existing data

- **GIVEN** an admin who sets `cleanImport: true`
- **WHEN** import runs for a HOA
- **THEN** all existing charges, charge notifications, and payments for apartments in that HOA are deleted before new data is inserted

#### Scenario: Standard (non-clean) import preserves existing data

- **GIVEN** an admin who does not set `cleanImport`
- **WHEN** import runs
- **THEN** existing records are upserted and no deletions occur before processing

---

### Requirement: Transactional Consistency

The system SHALL process all database operations for a single HOA within a single database transaction.

#### Scenario: Rollback on failure

- **GIVEN** an import that encounters a critical error mid-processing for a HOA
- **WHEN** the transaction fails
- **THEN** no partial data for that HOA is committed and the error is included in the import result

#### Scenario: Parallel HOA processing

- **GIVEN** files for multiple HOAs in a single import request
- **WHEN** import runs
- **THEN** all HOAs are processed in parallel, and failures in one HOA do not affect others

---

### Requirement: Import Statistics

The system SHALL return statistics for each HOA import showing totals and counts of created, updated, and errored records.

#### Scenario: Stats per entity type

- **GIVEN** a completed import
- **WHEN** the response is returned
- **THEN** it includes per-HOA statistics for apartments, charges, notifications, and payments (total, created, updated, errors)

---

### Requirement: WMB Files Per Data Type

The system SHALL track each `.wmb` file by its associated data type and store the data-as-of date per type on the HOA record.

#### Scenario: WMB files routed by filename

- **GIVEN** an import containing `lokal_ost_wys.wmb`, `nalicz_ost_wys.wmb`, and `pow_czynsz_ost_wys.wmb`
- **WHEN** files are grouped by HOA
- **THEN** each file is associated with its data type (apartments, charges, notifications respectively)

#### Scenario: Data date stored per type on HOA

- **GIVEN** a WMB file containing a `YYYYMMDD` date on its first line
- **WHEN** import completes for that HOA
- **THEN** the corresponding `DateTime` field (`apartmentsDataDate`, `chargesDataDate`, or `notificationsDataDate`) is updated on the HOA record

#### Scenario: Missing or unparseable WMB date stored as null

- **GIVEN** a WMB file with missing or malformed date content
- **WHEN** import runs
- **THEN** the corresponding date field on the HOA remains `null` and the import does not fail

#### Scenario: Data dates shown in import result UI

- **GIVEN** a completed HOA import where WMB dates were parsed
- **WHEN** the admin views the import result card for that HOA
- **THEN** each entity type (apartments, charges, notifications) shows its data-as-of date

---

### Requirement: HOA Header and Footer Saved on Notification Import

The system SHALL parse the header and footer from `pow_czynsz.txt` and persist them to the HOA record during notification import, overwriting previous values.

#### Scenario: Header and footer saved on first import

- **GIVEN** a `pow_czynsz.txt` file with text before the first `#` separator (header) and between the first and second `#` separator (footer)
- **WHEN** notification import completes
- **THEN** the HOA record's `header` and `footer` fields are set to the parsed values

#### Scenario: Header and footer updated on reimport

- **GIVEN** a HOA with existing `header` and `footer` values
- **WHEN** a new `pow_czynsz.txt` is imported with different content
- **THEN** the HOA's `header` and `footer` are overwritten with the new values

#### Scenario: Empty header or footer stored as null

- **GIVEN** a `pow_czynsz.txt` with no text before the first `#` separator
- **WHEN** notification import completes
- **THEN** the HOA `header` field is set to `null`

---

### Requirement: Charge Notification Parser Precision

The system SHALL parse all numeric fields in `pow_czynsz.txt` using the correct decimal separator, preserving full float precision.

#### Scenario: Quantity parsed as float

- **GIVEN** a notification line with `quantity` value in Polish locale format (e.g. `45,89`)
- **WHEN** the file is parsed
- **THEN** the `quantity` field is stored as `45.89`, not `45`

#### Scenario: Unit price parsed as float

- **GIVEN** a notification line with `unitPrice` in Polish locale format (e.g. `1,2300`)
- **WHEN** the file is parsed
- **THEN** the `unitPrice` field is stored as `1.23`, not `1`

#### Scenario: Existing records corrected on reimport

- **GIVEN** a `ChargeNotification` record with truncated integer values from a previous import
- **WHEN** the same HOA's `pow_czynsz.txt` is reimported
- **THEN** `hasNotificationChanged` detects the difference and the record is updated with correct float values

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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
