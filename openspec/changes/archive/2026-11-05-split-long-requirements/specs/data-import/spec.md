# Spec Delta

## MODIFIED Requirements

### Requirement: Batch File Import

The system SHALL allow admins to upload a collection of legacy files and process them as a batch, grouping files by HOA. A `.wmb` file SHALL be recognised as described in the WMB Files Per Data Type requirement.

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

### Requirement: WMB Files Per Data Type

The system SHALL track each `.wmb` file by its associated data type and store the data-as-of date per type on the HOA record. A `.wmb` file SHALL be routed to a data type by the same name prefix as the `.txt` files (`lok` for apartments, `nal_czynsz` and `nalicz` for charges, `pow_czynsz` for notifications), ignoring letter case, so suffixed names such as `lok2026.wmb` are accepted.

#### Scenario: WMB files routed by filename

- **GIVEN** an import containing `lokal_ost_wys.wmb`, `nalicz_ost_wys.wmb`, and `pow_czynsz_ost_wys.wmb`
- **WHEN** files are grouped by HOA
- **THEN** each file is associated with its data type (apartments, charges, notifications respectively)

#### Scenario: Suffixed WMB files routed by prefix

- **GIVEN** an HOA folder containing `lok2026.wmb` and `nal_czynsz_2026.wmb`
- **WHEN** files are grouped by HOA
- **THEN** `lok2026.wmb` is associated with apartments and `nal_czynsz_2026.wmb` with charges

#### Scenario: WMB file without a data type ignored

- **GIVEN** an HOA folder containing `wplaty.wmb`
- **WHEN** files are grouped by HOA
- **THEN** the file is accepted without an error and does not change any data date

#### Scenario: Data date stored per type on HOA

- **GIVEN** a WMB file containing a `YYYYMMDD` date on its first line
- **AND** the `.txt` files of the same data type are part of the import
- **WHEN** import completes for that HOA
- **THEN** the corresponding `DateTime` field (`apartmentsDataDate`, `chargesDataDate`, or `notificationsDataDate`) is updated on the HOA record

#### Scenario: WMB date ignored without its data type

- **GIVEN** an HOA folder containing `wplaty.txt` and `lokal_ost_wys.wmb`, but no `lok*.txt` file
- **WHEN** import completes for that HOA
- **THEN** `apartmentsDataDate` on the HOA record is not changed

#### Scenario: Newest WMB date wins

- **GIVEN** an HOA folder containing `lok2025.wmb` dated `20250101` and `lok2026.wmb` dated `20260301`, with `lok2025.txt` and `lok2026.txt`
- **WHEN** import completes for that HOA
- **THEN** `apartmentsDataDate` is set to 2026-03-01

#### Scenario: Missing or unparseable WMB date stored as null

- **GIVEN** a WMB file with missing or malformed date content
- **WHEN** import runs
- **THEN** the corresponding date field on the HOA remains `null` and the import does not fail

#### Scenario: Data dates shown in import result UI

- **GIVEN** a completed HOA import where WMB dates were parsed
- **WHEN** the admin views the import result card for that HOA
- **THEN** each entity type (apartments, charges, notifications) shows its data-as-of date

### Requirement: On-Demand Database Validation

The system SHALL let an administrator run, from the import page, the import validation checks (line totals, payment balance identity, calculated versus imported monthly charges, year-to-year balance drift) against the data already stored in the database, without importing files and without modifying data. Validation SHALL process HOAs with the same bounded concurrency as the import.

#### Scenario: Validation of stored data

- **GIVEN** an admin on the import page
- **WHEN** they trigger database validation
- **THEN** the checks run for every HOA, and the result banner, the year balance table and a per-HOA result with warnings and errors are displayed in that order

#### Scenario: Clean database

- **GIVEN** stored data with no inconsistencies
- **WHEN** validation runs
- **THEN** the success banner, the year balance table and a message that no warnings or errors were found are shown

#### Scenario: Bounded concurrency

- **WHEN** validation runs for several HOAs
- **THEN** no more than the import's HOA concurrency limit are validated at the same time, and the results are returned in HOA order

#### Scenario: Full validation skipped

- **GIVEN** an admin who checks "Pomiń pełną walidację" on the import page
- **WHEN** they trigger database validation
- **THEN** only the year balances are loaded, the year balance table is shown with the mismatch markers, and the banner states that the full validation was skipped and the number of balance mismatches

#### Scenario: Data not modified

- **WHEN** validation runs
- **THEN** no record is created, changed or deleted

#### Scenario: Admin only

- **WHEN** a non-admin calls the validation endpoint
- **THEN** the request is rejected as unauthorized

### Requirement: Naliczenia Import Validation Severity

The system SHALL validate each entry in `nal_czynsz.txt` before committing to the database. The Wplaty closing-balance check SHALL abort the HOA import on failure. The line-total identity check (`totalAmount ≈ quantity × unitPrice`) SHALL be reported as a warning only and SHALL NOT abort the import.

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

#### Scenario: Unexplained difference stated

- **GIVEN** a month where the `nal_czynsz.txt` sum differs from the `wplaty` charge and the difference is not equal to the sum of that month's `Wyrównanie` lines
- **WHEN** import validation runs
- **THEN** the warning states the unexplained difference in brackets after the two values

#### Scenario: Import result UI surfaces warnings

- **GIVEN** an import that produced one or more warnings
- **WHEN** the admin views the import result card
- **THEN** the card shows an `Ostrzeżenia` section listing each warning with its apartment and message
- **AND** period, line and line-total difference are shown for warnings that carry them

### Requirement: Payment Import Validation Severity

The system SHALL validate the closing balance of each entry in `wplaty.txt` before committing, and abort the HOA import if any entry fails the identity check.

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

The system SHALL store the monthly charges and the closing balance of each `wplaty.txt` entry unchanged in the legacy payment fields when it creates the payment record, and SHALL overwrite them on re-import when any of them differs from the stored value.

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

### Requirement: Owner Validity Dates Import

The system SHALL read the start date and the end date of each apartment row in a `lok` file and store them on the apartment as `validFrom` and `validTo`. Both dates are optional. A blank or non-`YYYYMMDD` value SHALL be stored as null without failing the row. Dates SHALL be updated on reimport when they change.

#### Scenario: Start and end dates stored

- **GIVEN** a `lok` row with a start date `20250210` and an end date `20250209` for a former owner
- **WHEN** import runs
- **THEN** the apartment row stores `validFrom` as 2025-02-10 and `validTo` as 2025-02-09

#### Scenario: Current owner has no end date

- **GIVEN** a `lok` row with a start date and an empty end date
- **WHEN** import runs
- **THEN** the apartment row stores `validFrom` and `validTo` is null

#### Scenario: Reimport clears a stored end date

- **GIVEN** an apartment whose `validTo` is stored from an earlier import
- **WHEN** a later `lok` row for the same apartment has an empty end date
- **THEN** the apartment row no longer stores an end date, because the owner is current again

#### Scenario: Invalid date stored as null

- **GIVEN** a `lok` row whose start date is not an 8-digit date
- **WHEN** import runs
- **THEN** `validFrom` is null and the row is imported

#### Scenario: Extra hash in owner name

- **GIVEN** a `lok` row whose owner name contains an extra `#`, so the row has 15 fields
- **WHEN** import runs
- **THEN** the start date and end date are read from the fields that follow the shifted owner name, not from the fields of a 14-field row

## ADDED Requirements

### Requirement: TXT Files Recognised by Name Prefix

A `.txt` file SHALL be recognised by its name prefix (`lok`, `nal_czynsz`, `pow_czynsz`, `wplaty`), ignoring letter case, so suffixed names such as `wplaty_2026.txt` are accepted.

#### Scenario: Letter case ignored

- **GIVEN** an HOA folder containing `LOK.txt` and `Wplaty_2026.txt`
- **WHEN** the admin imports the folder
- **THEN** the files are imported as apartments and payments

#### Scenario: Each prefix maps to its data type

- **GIVEN** an HOA folder containing `lok.txt`, `nal_czynsz.txt`, `pow_czynsz.txt` and `wplaty.txt`
- **WHEN** the admin imports the folder
- **THEN** they are imported as apartments, charges, notifications and payments respectively

### Requirement: Files of One Kind Merged

Several files of one kind in one HOA folder SHALL be merged, and a record present in more than one of them SHALL stop the HOA import with an error naming both files, even when validation is skipped.

#### Scenario: Three files merged

- **GIVEN** an HOA folder containing `lok1.txt`, `lok2.txt` and `lok3.txt` with different apartments
- **WHEN** the admin imports the folder
- **THEN** the apartments from all three files are imported together

#### Scenario: Repeated record stops the import with validation skipped

- **GIVEN** two `nal_czynsz` files in one HOA folder that contain the same charge line
- **WHEN** the admin imports the folder with full validation skipped
- **THEN** the HOA import stops before any data is written and the error names both files

### Requirement: Legacy and Unmatched WMB Names

The legacy names `lokal_ost_wys.wmb`, `nalicz_ost_wys.wmb` and `pow_czynsz_ost_wys.wmb` SHALL route to the same types. A `.wmb` file that matches no data type (such as `wplaty.wmb`) SHALL be accepted and ignored.

#### Scenario: Legacy name routes to its type

- **GIVEN** an HOA folder containing `pow_czynsz_ost_wys.wmb` with a date and the notification `.txt` file
- **WHEN** import completes for that HOA
- **THEN** `notificationsDataDate` is updated from the file

#### Scenario: Unmatched WMB name is ignored

- **GIVEN** an HOA folder containing `wplaty.wmb` and `other.wmb`
- **WHEN** the admin imports the folder
- **THEN** both files are accepted without an error and no data date changes

### Requirement: WMB Date Stored Only With Its Data Type

A WMB date SHALL only be stored when the `.txt` files of its data type are part of the same HOA import. Without them, the stored date SHALL be kept unchanged, even when the WMB file is present.

#### Scenario: Stored date kept without its TXT files

- **GIVEN** an HOA whose `chargesDataDate` is 2025-12-31 and an import containing `nal_czynsz.wmb` dated `20260301` but no charges `.txt` file
- **WHEN** import completes for that HOA
- **THEN** `chargesDataDate` is still 2025-12-31

### Requirement: Newest WMB Date Stored

When several WMB files of one data type are present for an HOA, the newest valid date among them SHALL be stored.

#### Scenario: Invalid date does not win

- **GIVEN** `lok2025.wmb` dated `20250101`, `lok2026.wmb` with a malformed date, and the apartments `.txt` files
- **WHEN** import completes for that HOA
- **THEN** `apartmentsDataDate` is set to 2025-01-01, the newest valid date

### Requirement: Validation Results Layout

Results SHALL be reported per HOA in the same warning and error format and download options as an import result. A result banner and the year balance table SHALL be shown above those results.

#### Scenario: Download options match import results

- **GIVEN** completed database validation with warnings for an HOA
- **WHEN** the admin views that HOA's result
- **THEN** it offers the same download options as an import result

#### Scenario: Banner and table above the results

- **GIVEN** completed database validation
- **WHEN** the result renders
- **THEN** the result banner and then the year balance table appear above the per-HOA results

### Requirement: Skip Full Validation Option

The admin SHALL be able to skip the full validation with the checkbox "Pomiń pełną walidację"; when it is checked, only the year balances SHALL be loaded and checked, and no file checks, cross-year checks or drift checks run.

#### Scenario: Skipped checks do not run

- **GIVEN** the checkbox is checked and stored data with a year-to-year balance drift
- **WHEN** validation runs
- **THEN** no drift warning is reported and only the year balances are checked

### Requirement: Cross-File Charge Check Is a Warning

The cross-file charge check SHALL compare charges per owner, apartment and billing period against the monthly charges imported from `wplaty.txt`; because those imported columns are known to be unreliable and are no longer used for display, a mismatch SHALL be reported as a warning and SHALL NOT abort the import. Each such warning SHALL state that the field from the files is ignored by the application.

#### Scenario: Warning says the file field is ignored

- **GIVEN** a monthly charge from `wplaty.txt` that differs from the sum of the `nal_czynsz.txt` lines
- **WHEN** import validation runs
- **THEN** the warning states that the field from the files is ignored by the application and the import is not aborted

### Requirement: Cross-File Warnings Rolled Up Per Year

Mismatches SHALL be rolled up into one warning per owner, apartment and year that lists each differing month with both values, and states when a month's difference equals the sum of its `Wyrównanie` lines; otherwise it states the unexplained difference.

#### Scenario: One warning per owner, apartment and year

- **GIVEN** an owner and apartment whose charges differ in March and in May of one year
- **WHEN** import validation runs
- **THEN** a single warning lists March and May, each with both values

### Requirement: Cross-Year Balance Compared Against Complete Years

The system SHALL also compare the opening balance of year N+1 with the closing balance of year N stored from the files when the database contains a complete record for year N, meaning one whose period ends on 31 December.

#### Scenario: Year ending on 31 December is compared

- **GIVEN** a stored payment record for year N whose period ends on 31 December
- **WHEN** an entry for year N+1 is imported with a different opening balance
- **THEN** the two balances are compared

### Requirement: Cross-Year Balance Mismatch Is a Warning

A cross-year balance mismatch SHALL be reported as one warning per apartment that states the closing balance from the file is ignored by the application, and SHALL NOT abort the import, because the closing balances of closed years in the files omit settlement lines and are not used for display.

#### Scenario: Warning says the closing balance is ignored

- **GIVEN** a cross-year opening and closing balance mismatch for an apartment
- **WHEN** import validation runs
- **THEN** one warning for that apartment states that the closing balance from the file is ignored by the application and the import is not aborted

### Requirement: Legacy Payment Fields Keep Being Validated

The system SHALL keep validating the legacy payment values: the closing-balance identity check (which aborts the import), the cross-file charge check and the year-to-year check on the stored closing balance (both warnings) all run on the values from the files.

#### Scenario: Cross-file warning uses the file values

- **GIVEN** a `wplaty.txt` entry whose monthly charges differ from the `nal_czynsz.txt` sums
- **WHEN** import validation runs
- **THEN** the cross-file warning is produced from the values in the files and the import continues

### Requirement: Legacy Payment Fields Never Presented

The legacy payment values SHALL NOT be presented anywhere in the application and SHALL NOT be changed by any calculation.

#### Scenario: Legacy values not displayed

- **GIVEN** a payment whose legacy closing balance is 500.00 and whose derived closing balance is -200.00
- **WHEN** the tenant views the payment
- **THEN** -200.00 is shown and 500.00 appears nowhere

### Requirement: Blank End Date Means Current Owner

A blank end date SHALL mean the owner is still current, not that the end date is unknown. Every reimport SHALL replace the stored dates, so a later export without an end date clears a previously stored one. The WMB export always contains both date columns, so a missing column is not a supported file variant.

#### Scenario: Blank end date marks the current owner

- **GIVEN** a `lok` row with a start date and a blank end date
- **WHEN** import runs
- **THEN** `validTo` is null and the owner is treated as current
