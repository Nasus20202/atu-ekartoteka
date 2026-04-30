# Capability: Data Import

## Purpose

Allows admins to import apartment, charge, payment, and charge notification data from legacy HOA system files (`.txt` / `.wmb` format), supporting batch processing across multiple HOAs in a single operation.

## Requirements

### Requirement: Batch File Import

The system SHALL allow admins to upload a collection of legacy files and process them as a batch, grouping files by HOA.

#### Scenario: Successful batch import

- **GIVEN** an authenticated admin
- **WHEN** they upload a set of files covering one or more HOAs
- **THEN** files are grouped by HOA identifier, each HOA is processed independently, and a summary of created/updated/errored records is returned for each HOA

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

The system SHALL parse charge records from a NAL-CZYNSZ format file and upsert them per apartment and billing period.

#### Scenario: Import new charges

- **GIVEN** charge entries in the import file for an apartment and period
- **WHEN** import runs
- **THEN** charge records are created with description, quantity, unit, unit price, total amount, and billing period

#### Scenario: Upsert on re-import

- **GIVEN** charges already existing for an apartment and billing period
- **WHEN** the same file is imported again (non-clean mode)
- **THEN** existing records are updated rather than duplicated (matched by `apartmentId` + `period` + `externalLineNo`)

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

The system SHALL store all monetary values from imported files (`nal_czynsz.txt`, `wplaty.txt`) as `Decimal(14, 4)` and SHALL persist the file-provided value verbatim without recomputation or rounding.

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

---

### Requirement: Naliczenia Import Validation

The system SHALL validate each entry in `nal_czynsz.txt` before committing to the database. The cross-file balance and Wplaty closing-balance checks SHALL abort the HOA import on failure. The line-total identity check (`totalAmount ≈ quantity × unitPrice`) SHALL be reported as a warning only and SHALL NOT abort the import.

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

- **GIVEN** the per-period sum of `nal_czynsz.totalAmount` for an apartment differs from the corresponding `wplaty` monthly charge by more than the cross-file tolerance
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Import result UI surfaces warnings

- **GIVEN** an import that produced one or more line-total warnings
- **WHEN** the admin views the import result card
- **THEN** the card shows an `Ostrzeżenia` section listing each warning with apartment, period, and the line-total difference

---

### Requirement: Payment Import Validation

The system SHALL validate the closing balance of each entry in `wplaty.txt` before committing, and abort the HOA import if any entry fails.

#### Scenario: Closing balance identity check

- **GIVEN** a `wplaty.txt` entry where `closingBalance` does not equal `openingBalance + totalPayments − totalCharges` within ±0.01
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Valid closing balance passes

- **GIVEN** all entries in `wplaty.txt` satisfy the balance identity
- **WHEN** import validation runs
- **THEN** no validation errors are recorded and the import proceeds normally
